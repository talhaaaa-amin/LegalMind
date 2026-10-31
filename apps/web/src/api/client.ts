import type {
  Case,
  CaseDocument,
  Lawyer,
  QuestionResponse,
  SavedAnswer,
} from '../types/contracts';

const STORAGE_KEY = 'legalmind.workspace.v1';

export interface WorkspaceData {
  lawyers: Lawyer[];
  cases: Case[];
  documents: CaseDocument[];
  responses: QuestionResponse[];
  savedAnswers: SavedAnswer[];
}

const seedData: WorkspaceData = {
  lawyers: [
    {
      id: 'lawyer-1',
      name: 'Amelia Hart',
      email: 'amelia.hart@hartlaw.com',
      createdAt: '2024-01-15T09:00:00.000Z',
    },
  ],
  cases: [
    {
      id: 'case-1',
      ownerId: 'lawyer-1',
      title: 'Riverside Development Dispute',
      description: 'Contract interpretation and notice obligations for the Riverside redevelopment project.',
      archived: false,
      createdAt: '2025-01-12T10:30:00.000Z',
      updatedAt: '2025-02-04T15:45:00.000Z',
    },
    {
      id: 'case-2',
      ownerId: 'lawyer-1',
      title: 'Northstar Employment Review',
      description: 'Review of restrictive covenants and severance obligations in an executive employment matter.',
      archived: false,
      createdAt: '2025-01-20T13:15:00.000Z',
      updatedAt: '2025-02-02T11:20:00.000Z',
    },
  ],
  documents: [
    {
      id: 'document-1',
      caseId: 'case-1',
      ownerId: 'lawyer-1',
      originalName: 'Riverside Master Agreement.pdf',
      pageCount: 84,
      activeVersion: 2,
      status: 'ready',
      createdAt: '2025-01-12T11:00:00.000Z',
    },
    {
      id: 'document-2',
      caseId: 'case-1',
      ownerId: 'lawyer-1',
      originalName: 'Notice of Delay.pdf',
      pageCount: 12,
      activeVersion: 1,
      status: 'indexing',
      createdAt: '2025-02-04T14:00:00.000Z',
    },
    {
      id: 'document-3',
      caseId: 'case-2',
      ownerId: 'lawyer-1',
      originalName: 'Executive Employment Agreement.pdf',
      pageCount: 31,
      activeVersion: 1,
      status: 'failed',
      errorCode: 'EXTRACTION_UNSUPPORTED_TABLE',
      createdAt: '2025-02-01T09:30:00.000Z',
    },
  ],
  responses: [
    {
      id: 'response-1',
      caseId: 'case-1',
      question: 'What notice period applies to a material delay?',
      status: 'answered',
      answer: 'The contractor must provide written notice within five business days after becoming aware of a material delay. The notice must describe the cause, anticipated duration, and mitigation steps.',
      citations: [
        {
          sourceId: 'source-1',
          documentId: 'document-1',
          documentName: 'Riverside Master Agreement.pdf',
          version: 2,
          chunkId: 'chunk-034',
          physicalPage: 42,
          excerpt: 'The Contractor shall notify the Owner in writing within five (5) Business Days after becoming aware of any event likely to cause delay.',
          isAvailable: true,
        },
      ],
      retrievalConfigVersion: 'rag-2025-01',
      createdAt: '2025-02-04T16:00:00.000Z',
    },
    {
      id: 'response-2',
      caseId: 'case-2',
      question: 'Is the post-employment non-solicitation clause time-limited?',
      status: 'partial',
      answer: 'The available agreement text indicates a twelve-month restriction, but the document requires re-indexing before the definition and geographic scope can be confirmed.',
      citations: [
        {
          sourceId: 'source-2',
          documentId: 'document-3',
          documentName: 'Executive Employment Agreement.pdf',
          version: 1,
          chunkId: 'chunk-018',
          physicalPage: 18,
          excerpt: 'For a period of twelve (12) months following termination, Executive shall not...',
          isAvailable: false,
        },
      ],
      limitations: 'One cited source is currently unavailable because document indexing failed.',
      retrievalConfigVersion: 'rag-2025-01',
      createdAt: '2025-02-02T12:00:00.000Z',
    },
  ],
  savedAnswers: [],
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const wait = (milliseconds = 120) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

function readWorkspace(): WorkspaceData {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return clone(seedData);
  }

  try {
    return JSON.parse(stored) as WorkspaceData;
  } catch (error) {
    console.error('LegalMind workspace data was invalid and has been reset.', error);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return clone(seedData);
  }
}

function writeWorkspace(data: WorkspaceData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const apiClient = {
  async health(): Promise<{ ok: boolean; service: string }> {
    await wait(80);
    return { ok: true, service: 'LegalMind local workspace' };
  },

  async getCurrentLawyer(): Promise<Lawyer> {
    await wait();
    return readWorkspace().lawyers[0];
  },

  async listCases(includeArchived = false): Promise<Case[]> {
    await wait();
    return readWorkspace().cases.filter((item) => includeArchived || !item.archived);
  },

  async getCase(caseId: string): Promise<Case | undefined> {
    await wait();
    return readWorkspace().cases.find((item) => item.id === caseId);
  },

  async listDocuments(caseId?: string): Promise<CaseDocument[]> {
    await wait();
    return readWorkspace().documents.filter((item) => !caseId || item.caseId === caseId);
  },

  async listResponses(caseId?: string): Promise<QuestionResponse[]> {
    await wait();
    return readWorkspace().responses.filter((item) => !caseId || item.caseId === caseId);
  },

  async saveAnswer(answer: SavedAnswer): Promise<SavedAnswer> {
    await wait();
    const workspace = readWorkspace();
    workspace.savedAnswers.push(clone(answer));
    writeWorkspace(workspace);
    return clone(answer);
  },

  async reset(): Promise<void> {
    await wait();
    writeWorkspace(clone(seedData));
  },
};
