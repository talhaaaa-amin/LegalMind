import type {
  Case,
  CaseDocument,
  Lawyer,
  QuestionResponse,
  SavedAnswer,
} from '../types/contracts';

const STORAGE_KEY = 'legalmind.workspace.v1';
const AUTH_STORAGE_KEY = 'legalmind.auth.lawyerId';
type SeededLawyerId = 'lawyer-1' | 'lawyer-2';

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
    {
      id: 'lawyer-2',
      name: 'Marcus Vance',
      email: 'marcus.vance@vancelaw.com',
      createdAt: '2024-03-10T09:00:00.000Z',
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
    {
      id: 'case-3',
      ownerId: 'lawyer-2',
      title: 'Vance Holdings Acquisition',
      description: 'Due diligence review of representations, warranties, and closing conditions for an acquisition.',
      archived: false,
      createdAt: '2025-02-08T09:15:00.000Z',
      updatedAt: '2025-02-10T16:30:00.000Z',
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
    {
      id: 'document-4',
      caseId: 'case-3',
      ownerId: 'lawyer-2',
      originalName: 'Vance Holdings Purchase Agreement.pdf',
      pageCount: 67,
      activeVersion: 1,
      status: 'ready',
      createdAt: '2025-02-08T10:00:00.000Z',
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
    {
      id: 'response-3',
      caseId: 'case-3',
      question: 'Which representations survive the closing date?',
      status: 'answered',
      answer: 'The fundamental representations survive until the applicable statute of limitations, while the remaining representations survive for eighteen months after closing.',
      citations: [
        {
          sourceId: 'source-3',
          documentId: 'document-4',
          documentName: 'Vance Holdings Purchase Agreement.pdf',
          version: 1,
          chunkId: 'chunk-052',
          physicalPage: 55,
          excerpt: 'The representations and warranties set forth in Sections 4.1 and 4.2 shall survive until the expiration of the applicable statute of limitations.',
          isAvailable: true,
        },
      ],
      retrievalConfigVersion: 'rag-2025-01',
      createdAt: '2025-02-10T17:00:00.000Z',
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
    const workspace = JSON.parse(stored) as WorkspaceData;
    const mergeById = <T extends { id: string }>(existing: T[], seeded: T[]) => [
      ...existing,
      ...seeded.filter((item) => !existing.some((current) => current.id === item.id)),
    ];
    const migratedWorkspace: WorkspaceData = {
      lawyers: mergeById(workspace.lawyers, seedData.lawyers),
      cases: mergeById(workspace.cases, seedData.cases),
      documents: mergeById(workspace.documents, seedData.documents),
      responses: mergeById(workspace.responses, seedData.responses),
      savedAnswers: workspace.savedAnswers ?? [],
    };
    writeWorkspace(migratedWorkspace);
    return migratedWorkspace;
  } catch (error) {
    console.error('LegalMind workspace data was invalid and has been reset.', error);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return clone(seedData);
  }
}

function writeWorkspace(data: WorkspaceData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getAuthenticatedLawyerId(): string | null {
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

function requireAuthenticatedLawyer(workspace: WorkspaceData): Lawyer | null {
  const lawyerId = getAuthenticatedLawyerId();
  return workspace.lawyers.find((lawyer) => lawyer.id === lawyerId) ?? null;
}

function requireCaseOwner(workspace: WorkspaceData, caseId: string): { workspace: WorkspaceData; caseItem: Case } {
  const lawyer = requireAuthenticatedLawyer(workspace);
  if (!lawyer) {
    throw new Error('You must be signed in to manage cases.');
  }
  const caseItem = workspace.cases.find((item) => item.id === caseId && item.ownerId === lawyer.id);
  if (!caseItem) {
    throw new Error('Case not found or inaccessible.');
  }
  return { workspace, caseItem };
}

export const apiClient = {
  async health(): Promise<{ ok: boolean; service: string }> {
    await wait(80);
    return { ok: true, service: 'LegalMind local workspace' };
  },

  async getCurrentLawyer(): Promise<Lawyer | null> {
    await wait();
    return requireAuthenticatedLawyer(readWorkspace());
  },

  async quickDemoLogin(lawyerId: SeededLawyerId): Promise<Lawyer> {
    await wait();
    const lawyer = readWorkspace().lawyers.find((item) => item.id === lawyerId);
    if (!lawyer) {
      throw new Error('Demo lawyer was not found.');
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, lawyer.id);
    return clone(lawyer);
  },

  async loginWithEmail(email: string, password: string): Promise<Lawyer> {
    await wait();
    if (!email.trim() || !password.trim()) {
      throw new Error('Email and password are required.');
    }
    const workspace = readWorkspace();
    const lawyer = workspace.lawyers.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
      ?? workspace.lawyers.find((item) => item.id === 'lawyer-1');
    if (!lawyer) {
      throw new Error('Unable to sign in with these credentials.');
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, lawyer.id);
    return clone(lawyer);
  },

  async registerLawyer(name: string, email: string, password: string): Promise<Lawyer> {
    await wait();
    if (!name.trim() || !email.trim() || !password.trim()) {
      throw new Error('Name, email, and password are required.');
    }
    const workspace = readWorkspace();
    if (workspace.lawyers.some((lawyer) => lawyer.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error('A lawyer with this email already exists.');
    }
    const lawyer: Lawyer = {
      id: `lawyer-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
    };
    workspace.lawyers.push(lawyer);
    writeWorkspace(workspace);
    window.localStorage.setItem(AUTH_STORAGE_KEY, lawyer.id);
    return clone(lawyer);
  },

  async logout(): Promise<void> {
    await wait(80);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  async listCases(includeArchived = false): Promise<Case[]> {
    await wait();
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) return [];
    return workspace.cases.filter(
      (item) => item.ownerId === lawyer.id && item.archived === includeArchived,
    );
  },

  async getCase(caseId: string): Promise<Case | undefined> {
    await wait();
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    return workspace.cases.find((item) => item.id === caseId && item.ownerId === lawyer?.id);
  },

  async createCase(input: { title: string; description: string }): Promise<Case> {
    await wait();
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) {
      throw new Error('You must be signed in to create a case.');
    }
    if (!input.title.trim() || !input.description.trim()) {
      throw new Error('A case title and description are required.');
    }
    const timestamp = new Date().toISOString();
    const caseItem: Case = {
      id: `case-${Date.now()}`,
      ownerId: lawyer.id,
      title: input.title.trim(),
      description: input.description.trim(),
      archived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    workspace.cases.push(caseItem);
    writeWorkspace(workspace);
    return clone(caseItem);
  },

  async updateCase(
    caseId: string,
    input: { title: string; description: string },
  ): Promise<Case> {
    await wait();
    const { workspace, caseItem } = requireCaseOwner(readWorkspace(), caseId);
    if (!input.title.trim() || !input.description.trim()) {
      throw new Error('A case title and description are required.');
    }
    caseItem.title = input.title.trim();
    caseItem.description = input.description.trim();
    caseItem.updatedAt = new Date().toISOString();
    writeWorkspace(workspace);
    return clone(caseItem);
  },

  async setCaseArchived(caseId: string, archived: boolean): Promise<Case> {
    await wait();
    const { workspace, caseItem } = requireCaseOwner(readWorkspace(), caseId);
    caseItem.archived = archived;
    caseItem.updatedAt = new Date().toISOString();
    writeWorkspace(workspace);
    return clone(caseItem);
  },

  async listDocuments(caseId?: string): Promise<CaseDocument[]> {
    await wait();
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) return [];
    return workspace.documents.filter(
      (item) => item.ownerId === lawyer.id && (!caseId || item.caseId === caseId),
    );
  },

  async listResponses(caseId?: string): Promise<QuestionResponse[]> {
    await wait();
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) return [];
    const ownedCaseIds = new Set(
      workspace.cases.filter((item) => item.ownerId === lawyer.id).map((item) => item.id),
    );
    return workspace.responses.filter(
      (item) => ownedCaseIds.has(item.caseId) && (!caseId || item.caseId === caseId),
    );
  },

  async listSavedAnswers(caseId?: string): Promise<SavedAnswer[]> {
    await wait();
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) return [];
    return workspace.savedAnswers.filter(
      (item) => item.ownerId === lawyer.id && (!caseId || item.caseId === caseId),
    );
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
