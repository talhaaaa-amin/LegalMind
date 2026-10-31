import type { Repository } from '../../db/connection.js';
import type { ChunkRecord } from '../../types/domain.js';
import { materializeDocumentChunks } from '../chunks/service.js';

export const RETRIEVAL_CONFIG_VERSION = 'lexical-v1';

function terms(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2)
    .map((term) => term.endsWith('ed') ? term.slice(0, -2) : term.endsWith('ing') ? term.slice(0, -3) : term));
}

function score(query: Set<string>, content: string): number {
  const contentTerms = terms(content);
  let matches = 0;
  query.forEach((term) => {
    if (contentTerms.has(term)) matches += 1;
  });
  return matches;
}

export async function retrieve(
  repository: Repository,
  ownerId: string,
  caseId: string,
  query: string,
  documentIds: string[],
  limit = 6,
): Promise<ChunkRecord[]> {
  const workspace = await repository.read();
  const scopedDocuments = workspace.documents.filter((document) =>
    document.ownerId === ownerId && document.caseId === caseId &&
    documentIds.includes(document.id) && document.status === 'ready' && !document.deletedAt);
  const missingDocumentIds = scopedDocuments
    .filter((document) => !workspace.chunks.some((chunk) =>
      chunk.documentId === document.id && chunk.version === document.activeVersion))
    .map((document) => document.id);
  if (missingDocumentIds.length > 0) {
    const generated = (await Promise.all(missingDocumentIds.map((id) =>
      materializeDocumentChunks(repository, id)))).flat();
    workspace.chunks = workspace.chunks.filter((chunk) => !missingDocumentIds.includes(chunk.documentId));
    workspace.chunks.push(...generated);
    await repository.write(workspace);
  }
  const refreshed = missingDocumentIds.length > 0 ? await repository.read() : workspace;
  const queryTerms = terms(query);
  return refreshed.chunks
    .filter((chunk) => chunk.ownerId === ownerId && chunk.caseId === caseId &&
      documentIds.includes(chunk.documentId) && refreshed.documents.some((document) =>
        document.id === chunk.documentId && document.ownerId === ownerId &&
        document.caseId === caseId && document.activeVersion === chunk.version &&
        document.status === 'ready' && !document.deletedAt))
    .map((chunk) => ({ chunk, score: score(queryTerms, chunk.content) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.chunk.physicalPage - right.chunk.physicalPage)
    .slice(0, limit)
    .map((item) => item.chunk);
}
