import 'dotenv/config';

import path from 'node:path';

function positivePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

export const env = {
  PORT: positivePort(process.env.PORT, 4000),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/legalmind',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  RAG_SERVICE_URL: process.env.RAG_SERVICE_URL ?? 'http://127.0.0.1:8000',
  STORAGE_DIR: path.resolve(process.cwd(), process.env.STORAGE_DIR ?? './storage/private'),
};
