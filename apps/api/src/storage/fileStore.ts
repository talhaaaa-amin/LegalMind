import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

function safePath(storageKey: string): string {
  const resolved = path.resolve(env.STORAGE_DIR, storageKey);
  if (!resolved.startsWith(`${env.STORAGE_DIR}${path.sep}`)) {
    throw new Error('Invalid private storage key.');
  }
  return resolved;
}

export async function savePrivateDocument(storageKey: string, payload: string | Buffer) {
  const filePath = safePath(storageKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, payload);
  return { storageKey, hash: createHash('sha256').update(payload).digest('hex') };
}

export async function deletePrivateDocument(storageKey?: string): Promise<void> {
  if (!storageKey) return;
  await fs.rm(safePath(storageKey), { force: true });
}
