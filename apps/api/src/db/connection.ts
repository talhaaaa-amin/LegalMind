import fs from 'node:fs/promises';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';
import type {
  Case,
  CaseDocument,
  LawyerRecord,
  QuestionResponse,
  SavedAnswer,
  SessionRecord,
  JobRecord,
} from '../types/domain.js';

export type StorageMode = 'mongodb' | 'json';

export interface JsonWorkspace {
  lawyers: LawyerRecord[];
  sessions: SessionRecord[];
  cases: Case[];
  documents: CaseDocument[];
  responses: QuestionResponse[];
  savedAnswers: SavedAnswer[];
  pageContents: Record<string, Record<string, { sectionTitle: string; content: string }>>;
  jobs: JobRecord[];
}

const initialWorkspace: JsonWorkspace = {
  lawyers: [
    { id: 'lawyer-1', name: 'Amelia Hart', email: 'amelia.hart@hartlaw.com', passwordHash: 'demo', createdAt: '2024-01-15T09:00:00.000Z' },
    { id: 'lawyer-2', name: 'Marcus Vance', email: 'marcus.vance@vancelaw.com', passwordHash: 'demo', createdAt: '2024-03-10T09:00:00.000Z' },
  ],
  sessions: [],
  cases: [
    { id: 'case-1', ownerId: 'lawyer-1', title: 'Riverside Development Dispute', description: 'Contract interpretation and notice obligations.', archived: false, createdAt: '2025-01-12T10:30:00.000Z', updatedAt: '2025-02-04T15:45:00.000Z' },
    { id: 'case-2', ownerId: 'lawyer-1', title: 'Northstar Employment Review', description: 'Review of restrictive covenants.', archived: false, createdAt: '2025-01-20T13:15:00.000Z', updatedAt: '2025-02-02T11:20:00.000Z' },
    { id: 'case-3', ownerId: 'lawyer-2', title: 'Vance Holdings Acquisition', description: 'Acquisition due diligence review.', archived: false, createdAt: '2025-02-08T09:15:00.000Z', updatedAt: '2025-02-10T16:30:00.000Z' },
  ],
  documents: [
    { id: 'document-1', caseId: 'case-1', ownerId: 'lawyer-1', originalName: 'Riverside Master Agreement.pdf', pageCount: 84, activeVersion: 2, status: 'ready', createdAt: '2025-01-12T11:00:00.000Z' },
    { id: 'document-2', caseId: 'case-1', ownerId: 'lawyer-1', originalName: 'Notice of Delay.pdf', pageCount: 12, activeVersion: 1, status: 'indexing', createdAt: '2025-02-04T14:00:00.000Z' },
    { id: 'document-3', caseId: 'case-2', ownerId: 'lawyer-1', originalName: 'Executive Employment Agreement.pdf', pageCount: 31, activeVersion: 1, status: 'failed', errorCode: 'EXTRACTION_UNSUPPORTED_TABLE', createdAt: '2025-02-01T09:30:00.000Z' },
    { id: 'document-4', caseId: 'case-3', ownerId: 'lawyer-2', originalName: 'Vance Holdings Purchase Agreement.pdf', pageCount: 67, activeVersion: 1, status: 'ready', createdAt: '2025-02-08T10:00:00.000Z' },
  ],
  responses: [
    { id: 'response-1', caseId: 'case-1', question: 'What notice period applies to a material delay?', status: 'answered', answer: 'The delayed party must provide written notice within ten business days [S1].', citations: [{ sourceId: 'S1', documentId: 'document-1', documentName: 'Riverside Master Agreement.pdf', version: 2, chunkId: 'chunk-042', physicalPage: 42, excerpt: 'The delayed party shall provide written notice within ten (10) business days after discovering the delay.', isAvailable: true }], retrievalConfigVersion: 'rag-2025-01', createdAt: '2025-02-05T10:00:00.000Z' },
    { id: 'response-2', caseId: 'case-2', question: 'What notice is required before termination?', status: 'partial', answer: 'Termination requires written notice specifying the material breach [S2].', citations: [{ sourceId: 'S2', documentId: 'document-3', documentName: 'Executive Employment Agreement.pdf', version: 1, chunkId: 'chunk-018', physicalPage: 18, excerpt: 'A termination notice must be delivered in writing and specify the material breach.', isAvailable: true }], limitations: 'The document is currently awaiting a successful extraction retry.', retrievalConfigVersion: 'rag-2025-01', createdAt: '2025-02-06T10:00:00.000Z' },
    { id: 'response-3', caseId: 'case-3', question: 'What is the governing law?', status: 'answered', answer: 'The agreement is governed by Delaware law [S3].', citations: [{ sourceId: 'S3', documentId: 'document-4', documentName: 'Vance Holdings Purchase Agreement.pdf', version: 1, chunkId: 'chunk-055', physicalPage: 55, excerpt: 'This agreement and any dispute arising from it are governed by the laws of the State of Delaware.', isAvailable: true }], retrievalConfigVersion: 'rag-2025-01', createdAt: '2025-02-07T10:00:00.000Z' },
  ],
  savedAnswers: [],
  jobs: [],
  pageContents: {
    'document-1': {
      '40': { sectionTitle: 'Notice and Cure', content: 'A party must provide written notice of a material delay and allow the contractual cure period before pursuing remedies.' },
      '41': { sectionTitle: 'Notice and Cure', content: 'Notice must identify the affected milestone, the anticipated impact, and the action requested from the receiving party.' },
      '42': { sectionTitle: 'Delay Notice Requirements', content: 'The delayed party shall provide written notice within ten (10) business days after discovering the delay. The notice must describe the cause, expected duration, and mitigation steps.' },
      '43': { sectionTitle: 'Remedies', content: 'Failure to provide timely notice may limit recovery to losses that could not reasonably have been avoided.' },
    },
    'document-3': {
      '17': { sectionTitle: 'Termination', content: 'Either party may terminate for material breach after written notice and an opportunity to cure.' },
      '18': { sectionTitle: 'Termination Notice', content: 'A termination notice must be delivered in writing and specify the material breach relied upon by the terminating party.' },
      '19': { sectionTitle: 'Post-Termination Obligations', content: 'Accrued payment obligations and confidentiality duties survive termination of this agreement.' },
    },
    'document-4': {
      '54': { sectionTitle: 'Closing Conditions', content: 'The obligations to close are subject to satisfaction or waiver of the conditions listed in this article.' },
      '55': { sectionTitle: 'Governing Law', content: 'This agreement and any dispute arising from it are governed by the laws of the State of Delaware, without regard to conflict-of-law principles.' },
      '56': { sectionTitle: 'Entire Agreement', content: 'This agreement constitutes the entire agreement between the parties concerning the transaction.' },
    },
  },
};

export interface Repository {
  mode: StorageMode;
  read(): Promise<JsonWorkspace>;
  write(workspace: JsonWorkspace): Promise<void>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function connectStorage(): Promise<Repository> {
  const filePath = path.resolve(env.STORAGE_DIR, '../db.json');
  await fs.mkdir(env.STORAGE_DIR, { recursive: true });

  try {
    const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 800 });
    await client.connect();
    await client.db().command({ ping: 1 });
    let workspace = clone(initialWorkspace);
    return {
      mode: 'mongodb',
      async read() {
        return clone(workspace);
      },
      async write(nextWorkspace) {
        workspace = clone(nextWorkspace);
      },
    };
  } catch (error) {
    console.warn('MongoDB unavailable; using persistent JSON storage.', error instanceof Error ? error.message : error);
  }

  async function readJson(): Promise<JsonWorkspace> {
    try {
      const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as Partial<JsonWorkspace>;
      const workspace: JsonWorkspace = {
        lawyers: (parsed.lawyers ?? []).map((lawyer) => ({ ...lawyer, passwordHash: lawyer.passwordHash ?? 'demo' })),
        sessions: parsed.sessions ?? [],
        cases: parsed.cases ?? [],
        documents: parsed.documents ?? [],
        responses: (() => {
          const existing = parsed.responses ?? [];
          return initialWorkspace.responses.map((seed) => existing.some((item) => item.id === seed.id) ? existing.find((item) => item.id === seed.id)! : seed).concat(
            existing.filter((item) => !initialWorkspace.responses.some((seed) => seed.id === item.id)),
          );
        })(),
        savedAnswers: parsed.savedAnswers ?? [],
        pageContents: parsed.pageContents ?? {},
        jobs: parsed.jobs ?? [],
      };
      await fs.writeFile(filePath, JSON.stringify(workspace, null, 2));
      return workspace;
    } catch {
      await fs.writeFile(filePath, JSON.stringify(initialWorkspace, null, 2));
      return clone(initialWorkspace);
    }
  }

  return {
    mode: 'json',
    read: readJson,
    async write(workspace) {
      await fs.writeFile(filePath, JSON.stringify(workspace, null, 2));
    },
  };
}
