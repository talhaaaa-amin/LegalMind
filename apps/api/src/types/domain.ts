export interface LawyerRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  lawyerId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Case {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  ownerId: string;
  originalName: string;
  pageCount: number;
  activeVersion: number;
  status: string;
  storageKey?: string;
  hash?: string;
  errorCode?: string;
  createdAt: string;
  deletedAt?: string;
}

export interface JobRecord {
  id: string;
  documentId: string;
  version: number;
  state: string;
  attemptCount: number;
  leaseUntil?: string;
  errorCode?: string;
  updatedAt: string;
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  caseId: string;
  ownerId: string;
  version: number;
  physicalPage: number;
  sectionTitle: string;
  content: string;
  parserVersion: string;
  chunkerVersion: string;
  createdAt: string;
}

export interface QuestionResponse {
  id: string;
  caseId: string;
  ownerId: string;
  question: string;
  status: string;
  answer: string;
  citations: unknown[];
  limitations?: string;
  retrievalConfigVersion: string;
  createdAt: string;
}

export interface SavedAnswer {
  id: string;
  caseId: string;
  ownerId: string;
  question: string;
  answer: string;
  citations: unknown[];
  createdAt: string;
}
