import type { Repository } from '../../db/connection.js';
import type { Case } from '../../types/domain.js';

export async function listByOwner(repository: Repository, ownerId: string, includeArchived: boolean): Promise<Case[]> {
  const workspace = await repository.read();
  return workspace.cases.filter((caseItem) => caseItem.ownerId === ownerId && caseItem.archived === includeArchived);
}

export async function findByIdAndOwner(repository: Repository, caseId: string, ownerId: string): Promise<Case | undefined> {
  const workspace = await repository.read();
  return workspace.cases.find((caseItem) => caseItem.id === caseId && caseItem.ownerId === ownerId);
}

export async function create(repository: Repository, caseItem: Case): Promise<Case> {
  const workspace = await repository.read();
  workspace.cases.push(caseItem);
  await repository.write(workspace);
  return caseItem;
}

export async function update(repository: Repository, caseItem: Case): Promise<Case> {
  const workspace = await repository.read();
  const index = workspace.cases.findIndex((item) => item.id === caseItem.id && item.ownerId === caseItem.ownerId);
  if (index >= 0) workspace.cases[index] = caseItem;
  await repository.write(workspace);
  return caseItem;
}
