import type { Repository } from '../../db/connection.js';
import { claimNext, update } from './model.js';
import { materializeDocumentChunks } from '../chunks/service.js';

const MAX_ATTEMPTS = 3;

export async function processNextJob(repository: Repository): Promise<boolean> {
  const job = await claimNext(repository);
  if (!job) return false;

  try {
    const workspace = await repository.read();
    const document = workspace.documents.find((candidate) =>
      candidate.id === job.documentId && !candidate.deletedAt);
    if (!document || document.activeVersion !== job.version) {
      await update(repository, job.id, {
        state: 'failed',
        errorCode: 'DOCUMENT_VERSION_UNAVAILABLE',
        leaseUntil: undefined,
      });
      return true;
    }

    const currentJob = workspace.jobs.find((candidate) => candidate.id === job.id);
    if (!currentJob) return true;
    const nextState = job.state === 'queued'
      ? 'extracting'
      : job.state === 'extracting'
        ? 'indexing'
        : 'ready';
    if (nextState === 'ready') {
      const chunks = await materializeDocumentChunks(repository, document.id);
      workspace.chunks = workspace.chunks.filter((chunk) => chunk.documentId !== document.id);
      workspace.chunks.push(...chunks);
    }
    document.status = nextState;
    if (nextState === 'ready') delete document.errorCode;
    currentJob.state = nextState;
    currentJob.leaseUntil = undefined;
    currentJob.updatedAt = new Date().toISOString();
    await repository.write(workspace);
    return true;
  } catch (error) {
    const attempts = job.attemptCount + 1;
    await update(repository, job.id, {
      attemptCount: attempts,
      state: attempts >= MAX_ATTEMPTS ? 'failed' : 'queued',
      errorCode: attempts >= MAX_ATTEMPTS ? 'PROCESSING_FAILED' : undefined,
      leaseUntil: undefined,
    });
    console.error(`Document job ${job.id} failed.`, error);
    return true;
  }
}
