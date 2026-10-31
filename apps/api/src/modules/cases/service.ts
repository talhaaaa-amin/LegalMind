import type { Repository } from '../../db/connection.js';
import { AppError } from '../../errors/AppError.js';
import { create, findByIdAndOwner, listByOwner, update } from './model.js';
import type { Case } from '../../types/domain.js';

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, 'INVALID_INPUT', `${field} is required.`);
  }
  return value.trim();
}

function requireCase(caseItem: Case | undefined): Case {
  if (!caseItem) throw new AppError(404, 'CASE_NOT_FOUND', 'Case not found or inaccessible.');
  return caseItem;
}

export function listCases(repository: Repository, ownerId: string, includeArchived: boolean) {
  return listByOwner(repository, ownerId, includeArchived);
}

export async function getCase(repository: Repository, ownerId: string, caseId: string) {
  return requireCase(await findByIdAndOwner(repository, caseId, ownerId));
}

export async function createCase(repository: Repository, ownerId: string, input: { title: unknown; description: unknown }) {
  const timestamp = new Date().toISOString();
  const caseItem: Case = {
    id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerId,
    title: requireText(input.title, 'title'),
    description: requireText(input.description, 'description'),
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return create(repository, caseItem);
}

export async function updateCase(
  repository: Repository,
  ownerId: string,
  caseId: string,
  input: { title: unknown; description: unknown },
) {
  const caseItem = requireCase(await findByIdAndOwner(repository, caseId, ownerId));
  caseItem.title = requireText(input.title, 'title');
  caseItem.description = requireText(input.description, 'description');
  caseItem.updatedAt = new Date().toISOString();
  return update(repository, caseItem);
}

export async function setCaseArchived(repository: Repository, ownerId: string, caseId: string, archived: unknown) {
  if (typeof archived !== 'boolean') {
    throw new AppError(400, 'INVALID_INPUT', 'archived must be a boolean.');
  }
  const caseItem = requireCase(await findByIdAndOwner(repository, caseId, ownerId));
  caseItem.archived = archived;
  caseItem.updatedAt = new Date().toISOString();
  return update(repository, caseItem);
}
