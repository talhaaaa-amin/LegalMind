import type { Repository } from '../../db/connection.js';
import type { SavedAnswer } from '../../types/domain.js';
export async function list(repository: Repository, caseId: string) { const workspace = await repository.read(); return workspace.savedAnswers.filter((answer) => answer.caseId === caseId); }
export async function create(repository: Repository, answer: SavedAnswer) { const workspace = await repository.read(); workspace.savedAnswers.push(answer); await repository.write(workspace); return answer; }
export async function remove(repository: Repository, id: string, ownerId: string) { const workspace = await repository.read(); const index = workspace.savedAnswers.findIndex((answer) => answer.id === id && answer.ownerId === ownerId); if (index < 0) return false; workspace.savedAnswers.splice(index, 1); await repository.write(workspace); return true; }
