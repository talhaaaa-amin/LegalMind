import type { Repository } from '../../db/connection.js';
import { AppError } from '../../errors/AppError.js';
import type { SavedAnswer } from '../../types/domain.js';
import { create, list, remove } from './model.js';

async function requireCase(repository: Repository, ownerId: string, caseId: string) {
  const workspace = await repository.read();
  if (!workspace.cases.some((item) => item.id === caseId && item.ownerId === ownerId)) throw new AppError(404, 'CASE_NOT_FOUND', 'Case not found or inaccessible.');
  return workspace;
}
function available(answer: SavedAnswer, workspace: Awaited<ReturnType<Repository['read']>>) {
  return { ...answer, citations: answer.citations.map((citation) => {
    if (typeof citation !== 'object' || citation === null || !('documentId' in citation)) return citation;
    const document = workspace.documents.find((item) => item.id === citation.documentId);
    return { ...citation, isAvailable: Boolean(document && !document.deletedAt && document.status === 'ready') };
  }) };
}
export async function listSavedAnswers(repository: Repository, ownerId: string, caseId: string) {
  const workspace = await requireCase(repository, ownerId, caseId);
  return (await list(repository, caseId)).filter((answer) => answer.ownerId === ownerId).map((answer) => available(answer, workspace));
}
export async function saveAnswer(repository: Repository, ownerId: string, caseId: string, input: { question?: unknown; answer?: unknown; citations?: unknown }) {
  await requireCase(repository, ownerId, caseId);
  if (typeof input.question !== 'string' || typeof input.answer !== 'string' || !input.question.trim() || !input.answer.trim()) throw new AppError(400, 'INVALID_INPUT', 'question and answer are required.');
  const saved: SavedAnswer = { id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, caseId, ownerId, question: input.question.trim(), answer: input.answer, citations: Array.isArray(input.citations) ? input.citations : [], createdAt: new Date().toISOString() };
  return create(repository, saved);
}
export async function deleteSavedAnswer(repository: Repository, ownerId: string, id: string) {
  if (!(await remove(repository, id, ownerId))) throw new AppError(404, 'SAVED_ANSWER_NOT_FOUND', 'Saved answer not found or inaccessible.');
}
