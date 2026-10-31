export interface Lawyer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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

export type DocumentStatus =
  | 'uploaded'
  | 'queued'
  | 'extracting'
  | 'indexing'
  | 'ready'
  | 'failed'
  | 'deleting';

export interface CaseDocument {
  id: string;
  caseId: string;
  ownerId: string;
  originalName: string;
  pageCount: number;
  activeVersion: number;
  status: DocumentStatus;
  errorCode?: string;
  createdAt: string;
  deletedAt?: string;
}

export interface Citation {
  sourceId: string;
  documentId: string;
  documentName: string;
  version: number;
  chunkId: string;
  physicalPage: number;
  excerpt: string;
  isAvailable: boolean;
}

export type AnswerStatus =
  | 'answered'
  | 'partial'
  | 'insufficient_evidence'
  | 'error';

export interface QuestionResponse {
  id: string;
  caseId: string;
  question: string;
  status: AnswerStatus;
  answer: string;
  citations: Citation[];
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
  citations: Citation[];
  createdAt: string;
}
