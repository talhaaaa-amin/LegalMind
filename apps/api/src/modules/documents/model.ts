import type { Repository } from '../../db/connection.js';
import type { CaseDocument, JobRecord } from '../../types/domain.js';

export async function listByOwner(repository: Repository, ownerId: string, caseId?: string) {
  const workspace = await repository.read();
  return workspace.documents.filter((document) =>
    document.ownerId === ownerId && !document.deletedAt && (!caseId || document.caseId === caseId));
}

export async function findByIdAndOwner(repository: Repository, documentId: string, ownerId: string) {
  const workspace = await repository.read();
  return workspace.documents.find((document) =>
    document.id === documentId && document.ownerId === ownerId && !document.deletedAt);
}

export async function create(repository: Repository, document: CaseDocument, job: JobRecord) {
  const workspace = await repository.read();
  workspace.documents.push(document);
  workspace.jobs.push(job);
  await repository.write(workspace);
  return { document, job };
}

export async function update(repository: Repository, document: CaseDocument, job?: JobRecord) {
  const workspace = await repository.read();
  const index = workspace.documents.findIndex((item) => item.id === document.id && item.ownerId === document.ownerId);
  if (index >= 0) workspace.documents[index] = document;
  if (job) {
    const jobIndex = workspace.jobs.findIndex((item) => item.id === job.id);
    if (jobIndex >= 0) workspace.jobs[jobIndex] = job;
    else workspace.jobs.push(job);
  }
  await repository.write(workspace);
  return document;
}
