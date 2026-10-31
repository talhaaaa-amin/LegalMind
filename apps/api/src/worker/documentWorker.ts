import type { Repository } from '../db/connection.js';
import { processNextJob } from '../modules/jobs/service.js';

const POLL_INTERVAL_MS = 250;

export function startDocumentWorker(repository: Repository): () => void {
  let stopped = false;
  let processing = false;

  const tick = async () => {
    if (stopped || processing) return;
    processing = true;
    try {
      await processNextJob(repository);
    } catch (error) {
      console.error('Document worker tick failed.', error);
    } finally {
      processing = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
  void tick();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
