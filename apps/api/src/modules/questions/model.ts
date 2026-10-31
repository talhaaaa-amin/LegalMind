import type { Repository } from '../../db/connection.js';
import type { QuestionResponse } from '../../types/domain.js';

export async function list(repository: Repository, caseId: string) {
  const workspace = await repository.read();
  return workspace.responses.filter((response) => response.caseId === caseId);
}

export async function create(repository: Repository, response: QuestionResponse) {
  const workspace = await repository.read();
  workspace.responses.unshift(response);
  await repository.write(workspace);
  return response;
}
