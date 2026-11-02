import type { Repository } from '../../db/connection.js';
import { AppError } from '../../errors/AppError.js';
import { deletePrivateDocument, savePrivateDocument } from '../../storage/fileStore.js';
import type { CaseDocument, JobRecord } from '../../types/domain.js';
import { findByIdAndOwner, listByOwner, create, update } from './model.js';
import { Buffer } from 'node:buffer';

function notFound(): never {
  throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found or inaccessible.');
}

async function requireCaseOwner(repository: Repository, caseId: string, ownerId: string) {
  const workspace = await repository.read();
  const caseItem = workspace.cases.find((item) => item.id === caseId && item.ownerId === ownerId);
  if (!caseItem) throw new AppError(404, 'CASE_NOT_FOUND', 'Case not found or inaccessible.');
  return workspace;
}

async function requireDocument(repository: Repository, documentId: string, ownerId: string) {
  return (await findByIdAndOwner(repository, documentId, ownerId)) ?? notFound();
}

function validateFile(file: { name?: unknown; size?: unknown; type?: unknown }) {
  const name = typeof file.name === 'string' ? file.name : '';
  const type = typeof file.type === 'string' ? file.type : '';
  const size = typeof file.size === 'number' ? file.size : Number(file.size);
  if ((!name.toLowerCase().endsWith('.pdf')) && type !== 'application/pdf') {
    throw new AppError(400, 'INVALID_FILE_TYPE', 'Only PDF files are supported.');
  }
  if (!Number.isFinite(size) || size < 0 || size > 20 * 1024 * 1024) {
    throw new AppError(400, 'FILE_TOO_LARGE', 'PDF files must be 20 MB or smaller.');
  }
  return { name, type, size };
}

function pdfPageCount(payload: Buffer): number | undefined {
  const matches = [...payload.toString('latin1').matchAll(/\/Type\s*\/Pages[\s\S]{0,10000}?\/Count\s+(\d+)/g)];
  const count = matches.map((match) => Number(match[1])).find((value) => Number.isInteger(value) && value > 0);
  return count;
}

function pdfPageContents(payload: Buffer): Record<string, { sectionTitle: string; content: string }> {
  const source = payload.toString('latin1');
  const objects = new Map<number, string>();
  for (const match of source.matchAll(/(\d+)\s+0\s+obj\b([\s\S]*?)endobj/g)) {
    objects.set(Number(match[1]), match[2]);
  }

  const pageObjects = [...objects.entries()]
    .filter(([, value]) => /\/Type\s*\/Page\b/.test(value))
    .sort(([left], [right]) => left - right);
  const pages: Record<string, { sectionTitle: string; content: string }> = {};
  for (const [pageIndex, [, pageObject]] of pageObjects.entries()) {
    const contentsReference = pageObject.match(/\/Contents\s+(\d+)\s+0\s+R/);
    const contentsObject = contentsReference ? objects.get(Number(contentsReference[1])) : undefined;
    if (!contentsObject) continue;
    const stream = contentsObject.match(/\bstream\r?\n([\s\S]*?)\r?\nendstream\b/)?.[1] ?? '';
    const text = [...stream.matchAll(/\(((?:\\.|[^\\()])*)\)\s*Tj/g)]
      .map((match) => match[1]
        .replace(/\\([\\()])/g, '$1')
        .replace(/\\n/g, '\n')
        .trim())
      .filter(Boolean)
      .join('\n')
      .trim();
    if (!text) continue;
    const [sectionTitle] = text.split('\n');
    pages[String(pageIndex + 1)] = { sectionTitle, content: text };
  }
  return pages;
}

export async function listDocuments(repository: Repository, ownerId: string, caseId?: string) {
  if (caseId) await requireCaseOwner(repository, caseId, ownerId);
  return listByOwner(repository, ownerId, caseId);
}

export async function uploadDocument(
  repository: Repository,
  ownerId: string,
  caseId: string,
  input: { name?: unknown; size?: unknown; type?: unknown; content?: unknown },
) {
  await requireCaseOwner(repository, caseId, ownerId);
  const file = validateFile(input);
  const id = `document-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storageKey = `${ownerId}/${id}.pdf`;
  const payload = typeof input.content === 'string' && input.content.startsWith('base64:')
    ? Buffer.from(input.content.slice('base64:'.length), 'base64')
    : file.name;
  const stored = await savePrivateDocument(storageKey, payload);
  const pageCount = Buffer.isBuffer(payload) ? pdfPageCount(payload) : undefined;
  const timestamp = new Date().toISOString();
  const document: CaseDocument = {
    id, caseId, ownerId, originalName: file.name, pageCount: pageCount ?? 1,
    activeVersion: 1, status: 'queued', createdAt: timestamp, storageKey: stored.storageKey, hash: stored.hash,
  };
  const job: JobRecord = {
    id: `job-${id}`, documentId: id, version: 1, state: 'queued', attemptCount: 0, updatedAt: timestamp,
  };
  const result = await create(repository, document, job);
  if (Buffer.isBuffer(payload)) {
    const workspace = await repository.read();
    workspace.pageContents[id] = pdfPageContents(payload);
    await repository.write(workspace);
  }
  return result;
}

export async function getStatus(repository: Repository, ownerId: string, documentId: string) {
  const document = await requireDocument(repository, documentId, ownerId);
  const workspace = await repository.read();
  const job = workspace.jobs.find((item) => item.documentId === document.id);
  return { document, job };
}

export async function updateStatus(repository: Repository, ownerId: string, documentId: string, status: string, errorCode?: string) {
  const document = await requireDocument(repository, documentId, ownerId);
  const workspace = await repository.read();
  const job = workspace.jobs.find((item) => item.documentId === document.id);
  document.status = status;
  if (errorCode) document.errorCode = errorCode;
  else delete document.errorCode;
  if (job) {
    job.state = status;
    job.errorCode = errorCode;
    job.updatedAt = new Date().toISOString();
  }
  return update(repository, document, job);
}

export async function retry(repository: Repository, ownerId: string, documentId: string) {
  const document = await requireDocument(repository, documentId, ownerId);
  if (document.status !== 'failed') throw new AppError(400, 'INVALID_STATUS', 'Only failed documents can be retried.');
  const workspace = await repository.read();
  const job = workspace.jobs.find((item) => item.documentId === document.id);
  if (!job) throw new AppError(404, 'JOB_NOT_FOUND', 'Document job not found.');
  document.status = 'queued';
  delete document.errorCode;
  job.state = 'queued';
  job.attemptCount += 1;
  delete job.errorCode;
  job.updatedAt = new Date().toISOString();
  return update(repository, document, job);
}

export async function source(repository: Repository, ownerId: string, documentId: string, pageNumber: number) {
  const document = await requireDocument(repository, documentId, ownerId);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > document.pageCount) {
    throw new AppError(400, 'INVALID_PAGE', `Page must be between 1 and ${document.pageCount}.`);
  }
  const workspace = await repository.read();
  const page = workspace.pageContents[documentId]?.[String(pageNumber)];
  return {
    document, pageNumber, totalPages: document.pageCount,
    sectionTitle: page?.sectionTitle ?? 'Document text',
    content: page?.content ?? `Page ${pageNumber} of ${document.originalName}. This page is available for document review.`,
  };
}

export async function remove(repository: Repository, ownerId: string, documentId: string) {
  await requireDocument(repository, documentId, ownerId);
  const workspace = await repository.read();
  const document = workspace.documents.find((item) =>
    item.id === documentId && item.ownerId === ownerId && !item.deletedAt);
  if (!document) notFound();
  document.deletedAt = new Date().toISOString();
  document.status = 'deleting';
  workspace.responses = workspace.responses.map((response) => ({
    ...response, citations: response.citations.map((citation) =>
      typeof citation === 'object' && citation !== null && 'documentId' in citation && citation.documentId === documentId
        ? { ...citation, isAvailable: false } : citation),
  }));
  workspace.savedAnswers = workspace.savedAnswers.map((answer) => ({
    ...answer, citations: answer.citations.map((citation) =>
      typeof citation === 'object' && citation !== null && 'documentId' in citation && citation.documentId === documentId
        ? { ...citation, isAvailable: false } : citation),
  }));
  await repository.write(workspace);
  await deletePrivateDocument(document.storageKey);
}
