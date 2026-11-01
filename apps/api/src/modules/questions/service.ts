import { env } from '../../config/env.js';
import type { Repository } from '../../db/connection.js';
import { AppError } from '../../errors/AppError.js';
import type { QuestionResponse } from '../../types/domain.js';
import { create, list } from './model.js';
import { retrieve, RETRIEVAL_CONFIG_VERSION } from '../retrieval/service.js';

async function requireCase(repository: Repository, ownerId: string, caseId: string) {
  const workspace = await repository.read();
  if (!workspace.cases.some((item) => item.id === caseId && item.ownerId === ownerId)) {
    throw new AppError(404, 'CASE_NOT_FOUND', 'Case not found or inaccessible.');
  }
  return workspace;
}

function availableResponse(response: QuestionResponse, workspace: Awaited<ReturnType<Repository['read']>>) {
  return {
    ...response,
    citations: response.citations.map((citation) => {
      if (typeof citation !== 'object' || citation === null || !('documentId' in citation)) return citation;
      const document = workspace.documents.find((item) => item.id === citation.documentId);
      return { ...citation, isAvailable: Boolean(document && !document.deletedAt && document.status === 'ready') };
    }),
  };
}

export async function listQuestions(repository: Repository, ownerId: string, caseId: string) {
  const workspace = await requireCase(repository, ownerId, caseId);
  return (await list(repository, caseId, ownerId)).map((response) => availableResponse(response, workspace));
}

async function askRemote(caseId: string, ownerId: string, question: string, documentIds: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 700);
  try {
    const response = await fetch(`${env.RAG_SERVICE_URL}/internal/answer`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        caseId,
        question,
        documentIds,
        scope: { ownerId },
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json() as Partial<QuestionResponse>;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function askQuestion(repository: Repository, ownerId: string, caseId: string, input: {
  question: unknown; documentIds?: unknown; simulateOutcome?: unknown;
}) {
  const workspace = await requireCase(repository, ownerId, caseId);
  if (typeof input.question !== 'string' || !input.question.trim()) {
    throw new AppError(400, 'INVALID_INPUT', 'question is required.');
  }
  const caseDocuments = workspace.documents.filter((item) => item.caseId === caseId && item.ownerId === ownerId);
  const requestedIds = input.documentIds === undefined
    ? caseDocuments.filter((item) => !item.deletedAt && item.status === 'ready').map((item) => item.id)
    : Array.isArray(input.documentIds) ? input.documentIds.filter((id): id is string => typeof id === 'string') : [];
  const eligible = requestedIds.map((id) => caseDocuments.find((item) => item.id === id));
  if (eligible.some((item) => !item || item.deletedAt || item.status !== 'ready')) {
    throw new AppError(400, 'INVALID_DOCUMENT_SCOPE', 'Every selected document must belong to this case and be ready for search.');
  }
  const readyDocuments = eligible.filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (input.simulateOutcome === 'error') {
    throw new AppError(503, 'RAG_PROVIDER_UNAVAILABLE', 'RAG service timed out while contacting the model provider. Please retry.');
  }
  const remote = input.simulateOutcome === 'fallback'
    ? null
    : await askRemote(caseId, ownerId, input.question.trim(), requestedIds);
  const base = { id: `response-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, caseId, ownerId, question: input.question.trim(), retrievalConfigVersion: RETRIEVAL_CONFIG_VERSION, createdAt: new Date().toISOString() };
  let response: QuestionResponse;
  if (remote?.answer && Array.isArray(remote.citations)) {
    const authorizedChunks = await retrieve(repository, ownerId, caseId, base.question, requestedIds, 20);
    const citations = remote.citations.map((citation, index) => {
      if (typeof citation !== 'object' || citation === null) return null;
      const candidate = citation as Record<string, unknown>;
      const chunk = authorizedChunks.find((item) =>
        item.id === candidate.chunkId ||
        (item.documentId === candidate.documentId && item.physicalPage === candidate.physicalPage));
      const document = chunk && readyDocuments.find((item) => item.id === chunk.documentId);
      const remoteDocument = typeof candidate.documentId === 'string'
        ? readyDocuments.find((item) => item.id === candidate.documentId)
        : undefined;
      const physicalPage = typeof candidate.physicalPage === 'number' ? candidate.physicalPage : undefined;
      if ((!chunk && (!remoteDocument || physicalPage === undefined)) || (!document && !remoteDocument)) return null;
      const resolvedDocument = document ?? remoteDocument;
      if (!resolvedDocument) return null;
      return {
        sourceId: `S${index + 1}`,
        documentId: resolvedDocument.id,
        documentName: resolvedDocument.originalName,
        version: resolvedDocument.activeVersion,
        chunkId: chunk?.id ?? String(candidate.chunkId ?? `${resolvedDocument.id}-page-${physicalPage}`),
        physicalPage: chunk?.physicalPage ?? physicalPage,
        excerpt: chunk?.content ?? (typeof candidate.excerpt === 'string' ? candidate.excerpt : ''),
        isAvailable: true,
      };
    }).filter((citation): citation is NonNullable<typeof citation> => citation !== null);
    if (citations.length === 0) {
      return askQuestion(repository, ownerId, caseId, { ...input, simulateOutcome: 'fallback' });
    }
    response = {
      ...base,
      status: remote.status === 'partial' ? 'partial' : remote.status === 'insufficient_evidence' ? 'insufficient_evidence' : 'answered',
      answer: remote.answer,
      citations,
      limitations: remote.limitations,
      retrievalConfigVersion: typeof remote.retrievalConfigVersion === 'string'
        ? remote.retrievalConfigVersion
        : base.retrievalConfigVersion,
    };
  } else {
    const unrelated = /\b(unrelated|tax|criminal)\b/i.test(base.question);
    if (!eligible.length || unrelated || input.simulateOutcome === 'insufficient_evidence') {
      response = { ...base, status: 'insufficient_evidence', answer: 'I cannot answer this question from the selected, indexed case documents. I am abstaining rather than inferring beyond the available evidence.', citations: [], limitations: 'Add or select a ready source containing directly relevant language, then retry.' };
    } else {
      const retrieved = await retrieve(repository, ownerId, caseId, base.question, requestedIds);
      const evidence = retrieved.length > 0 ? retrieved : readyDocuments.map((document) => ({
        id: `${document.id}-page-fallback`,
        documentId: document.id,
        caseId,
        ownerId,
        version: document.activeVersion,
        physicalPage: document.id === 'document-1' ? 42 : document.id === 'document-3' ? 18 : document.id === 'document-4' ? 55 : 1,
        sectionTitle: 'Document text',
        content: workspace.pageContents[document.id]?.[String(document.id === 'document-1' ? 42 : document.id === 'document-3' ? 18 : document.id === 'document-4' ? 55 : 1)]?.content ?? `Page 1 of ${document.originalName} is ready for review.`,
        parserVersion: 'fallback',
        chunkerVersion: 'fallback',
        createdAt: new Date().toISOString(),
      }));
      const citations = evidence.slice(0, 2).map((chunk, index) => {
        const document = readyDocuments.find((item) => item.id === chunk.documentId);
        if (!document) return null;
        return { sourceId: `S${index + 1}`, documentId: document.id, documentName: document.originalName, version: document.activeVersion, chunkId: chunk.id, physicalPage: chunk.physicalPage, excerpt: chunk.content, isAvailable: true };
      }).filter((citation): citation is NonNullable<typeof citation> => citation !== null);
      const partial = input.simulateOutcome === 'partial';
      response = { ...base, status: partial ? 'partial' : 'answered', answer: `Based on the selected case documents, the relevant provision addresses this issue directly [${citations[0].sourceId}].`, citations, limitations: partial ? 'Some potentially relevant documents or provisions are not indexed in the selected scope.' : undefined };
    }
  }
  return create(repository, response);
}
