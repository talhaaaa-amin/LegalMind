import type { Repository } from '../../db/connection.js';
import type { JobRecord } from '../../types/domain.js';

const LEASE_MS = 30_000;

export async function claimNext(repository: Repository): Promise<JobRecord | null> {
  const workspace = await repository.read();
  const now = Date.now();
  const job = workspace.jobs.find((candidate) => {
    if (!['queued', 'extracting', 'indexing'].includes(candidate.state)) return false;
    return !candidate.leaseUntil || Date.parse(candidate.leaseUntil) <= now;
  });
  if (!job) return null;

  job.leaseUntil = new Date(now + LEASE_MS).toISOString();
  job.updatedAt = new Date(now).toISOString();
  await repository.write(workspace);
  return { ...job };
}

export async function update(repository: Repository, jobId: string, change: Partial<JobRecord>) {
  const workspace = await repository.read();
  const job = workspace.jobs.find((candidate) => candidate.id === jobId);
  if (!job) return null;
  Object.assign(job, change, { updatedAt: new Date().toISOString() });
  await repository.write(workspace);
  return { ...job };
}
