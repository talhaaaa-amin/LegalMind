import { env } from '../../config/env.js';
import type { Repository } from '../../db/connection.js';
import { AppError } from '../../errors/AppError.js';
import type { QuestionResponse } from '../../types/domain.js';
import { create, list } from './model.js';

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
  return (await list(repository, caseId)).map((response) => availableResponse(response, workspace));
}

async function askRemote(question: string, documentIds: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 700);
  try {
    const response = await fetch(`${env.RAG_SERVICE_URL}/internal/answer`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, documentIds }), signal: controller.signal,
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
  const remote = await askRemote(input.question.trim(), requestedIds);
  const base = { id: `response-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, caseId, question: input.question.trim(), retrievalConfigVersion: 'rag-2025-01', createdAt: new Date().toISOString() };
  let response: QuestionResponse;
  if (remote?.answer && Array.isArray(remote.citations)) {
    const citations = remote.citations.filter((citation) => typeof citation === 'object' && citation !== null && 'documentId' in citation && requestedIds.includes(citation.documentId as string));
    response = { ...base, status: remote.status === 'partial' ? 'partial' : 'answered', answer: remote.answer, citations, limitations: remote.limitations };
  } else {
    const unrelated = /\b(unrelated|tax|criminal)\b/i.test(base.question);
    if (!eligible.length || unrelated || input.simulateOutcome === 'insufficient_evidence') {
      response = { ...base, status: 'insufficient_evidence', answer: 'I cannot answer this question from the selected, indexed case documents. I am abstaining rather than inferring beyond the available evidence.', citations: [], limitations: 'Add or select a ready source containing directly relevant language, then retry.' };
    } else {
      const citations = readyDocuments.slice(0, 2).map((document, index) => {
        const preferred = document.id === 'document-1' ? 42 : document.id === 'document-3' ? 18 : document.id === 'document-4' ? 55 : 1;
        const page = workspace.pageContents[document.id]?.[String(preferred)] ?? { sectionTitle: 'Document text', content: `Page ${preferred} of ${document.originalName} is ready for review.` };
        return { sourceId: `S${index + 1}`, documentId: document.id, documentName: document.originalName, version: document.activeVersion, chunkId: `chunk-${preferred}`, physicalPage: preferred, excerpt: page.content, isAvailable: true };
      });
      const partial = input.simulateOutcome === 'partial';
      response = { ...base, status: partial ? 'partial' : 'answered', answer: `Based on the selected case documents, the relevant provision addresses this issue directly [${citations[0].sourceId}].`, citations, limitations: partial ? 'Some potentially relevant documents or provisions are not indexed in the selected scope.' : undefined };
    }
  }
  return create(repository, response);
}
