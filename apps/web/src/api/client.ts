import type {
  Case,
  CaseDocument,
  Lawyer,
  AnswerStatus,
  Citation,
  QuestionResponse,
  SavedAnswer,
} from '../types/contracts';

const STORAGE_KEY = 'legalmind.workspace.v1';
const AUTH_STORAGE_KEY = 'legalmind.auth.lawyerId';
const AUTH_TOKEN_KEY = 'legalmind.auth.token';
type SeededLawyerId = 'lawyer-1' | 'lawyer-2';

export interface WorkspaceData {
  lawyers: Lawyer[];
  cases: Case[];
  documents: CaseDocument[];
  responses: QuestionResponse[];
  savedAnswers: SavedAnswer[];
  pageContents: Record<string, Record<string, {
    sectionTitle: string;
    content: string;
  }>>;
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
          sourceId: 'S1',
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
      answer: 'The available agreement text indicates a twelve-month restriction [S2], but the document requires re-indexing before the definition and geographic scope can be confirmed.',
      citations: [
        {
          sourceId: 'S2',
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
      answer: 'The fundamental representations survive until the applicable statute of limitations [S3], while the remaining representations survive for eighteen months after closing.',
      citations: [
        {
          sourceId: 'S3',
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
  pageContents: {
    'document-1': {
      '40': {
        sectionTitle: 'Article 7 · Delays and Extensions',
        content: 'The Contractor shall exercise all reasonable diligence to maintain the Progress Schedule and shall promptly notify the Owner of any circumstance that may affect the scheduled completion date.',
      },
      '41': {
        sectionTitle: 'Article 7 · Delays and Extensions',
        content: 'Notice under this Article shall include the cause of the delay, the estimated duration, and the measures being taken to mitigate its effect on the Work.',
      },
      '42': {
        sectionTitle: 'Article 7 · Delays and Extensions',
        content: 'The Contractor shall notify the Owner in writing within five (5) Business Days after becoming aware of any event likely to cause delay. Failure to provide timely notice shall waive any claim for an extension of time to the extent the Owner is prejudiced.',
      },
      '43': {
        sectionTitle: 'Article 7 · Delays and Extensions',
        content: 'Upon receipt of a proper notice, the parties shall meet promptly to review the anticipated impact and agree on reasonable mitigation measures.',
      },
    },
    'document-3': {
      '17': {
        sectionTitle: 'Section 12 · Restrictive Covenants',
        content: 'The Executive acknowledges that the Company has legitimate interests in protecting its confidential information, customer relationships, and workforce.',
      },
      '18': {
        sectionTitle: 'Section 12 · Restrictive Covenants',
        content: 'For a period of twelve (12) months following termination, Executive shall not solicit or induce any customer, prospective customer, or employee of the Company with whom Executive had material contact during the final year of employment.',
      },
      '19': {
        sectionTitle: 'Section 12 · Restrictive Covenants',
        content: 'The restrictions in this Section shall be interpreted to protect the Company interests without preventing the Executive from pursuing lawful employment.',
      },
    },
    'document-4': {
      '54': {
        sectionTitle: 'Article IX · Survival',
        content: 'The representations and warranties of the parties are made as of the date of this Agreement and as of the Closing Date, unless expressly stated otherwise.',
      },
      '55': {
        sectionTitle: 'Article IX · Survival',
        content: 'The representations and warranties set forth in Sections 4.1 and 4.2 shall survive until the expiration of the applicable statute of limitations. All other representations and warranties shall survive for eighteen (18) months following the Closing Date.',
      },
      '56': {
        sectionTitle: 'Article IX · Survival',
        content: 'The covenants and agreements of the parties shall survive the Closing in accordance with their respective terms.',
      },
    },
  },
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
      pageContents: workspace.pageContents ?? seedData.pageContents,
    };
    migratedWorkspace.responses = migratedWorkspace.responses.map((response) => ({
      ...response,
      answer: response.answer
        .replace(/\[source-1\]/g, '[S1]')
        .replace(/\[source-2\]/g, '[S2]')
        .replace(/\[source-3\]/g, '[S3]'),
      citations: response.citations.map((citation) => ({
        ...citation,
        sourceId: citation.sourceId.replace('source-1', 'S1').replace('source-2', 'S2').replace('source-3', 'S3'),
      })),
    }));
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

function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const token = getAuthToken();
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(`/api/auth${path}`, { ...init, headers, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Authentication request failed with status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

class HttpRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function caseRequest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const token = getAuthToken();
  if (token) headers.set('authorization', `Bearer ${token}`);
  try {
    const response = await fetch(`/api/cases${path}`, { ...init, headers, credentials: 'include' });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new HttpRequestError(
        response.status,
        body?.error?.message ?? `Case request failed with status ${response.status}.`,
      );
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof TypeError) {
      console.warn('LegalMind cases API is unavailable; using local workspace mode.', error);
      return null;
    }
    throw error;
  }
}

async function documentRequest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
 const headers = new Headers(init.headers);
 headers.set('content-type', 'application/json');
 const token = getAuthToken();
 if (token) headers.set('authorization', `Bearer ${token}`);
 try {
   const response = await fetch(`/api${path}`, { ...init, headers, credentials: 'include' });
   if (!response.ok) {
     const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
     throw new HttpRequestError(
       response.status,
       body?.error?.message ?? `Document request failed with status ${response.status}.`,
     );
   }
   return await response.json() as T;
 } catch (error) {
   if (error instanceof TypeError) {
     console.warn('LegalMind documents API is unavailable; using local workspace mode.', error);
     return null;
   }
   throw error;
 }
}

function syncCase(caseItem: Case): void {
  const workspace = readWorkspace();
  const index = workspace.cases.findIndex((item) => item.id === caseItem.id);
  if (index >= 0) workspace.cases[index] = caseItem;
  else workspace.cases.push(caseItem);
  writeWorkspace(workspace);
}

function syncCases(cases: Case[]): void {
  cases.forEach(syncCase);
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
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error(`API health check failed with status ${response.status}.`);
      return await response.json() as { ok: boolean; service: string; storageMode?: string };
    } catch (error) {
      console.warn('LegalMind API is unavailable; using local workspace mode.', error);
      return { ok: true, service: 'LegalMind local workspace' };
    }
  },

  async getCurrentLawyer(): Promise<Lawyer | null> {
    await wait();
    if (getAuthToken()) {
      try {
        const result = await authRequest<{ lawyer: Lawyer }>('/me');
        return result.lawyer;
      } catch (error) {
        if (!(error instanceof TypeError)) {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          return null;
        }
        console.warn('Real auth session is unavailable; using local workspace session.', error);
      }
    }
    return requireAuthenticatedLawyer(readWorkspace());
  },

  async quickDemoLogin(lawyerId: SeededLawyerId): Promise<Lawyer> {
    await wait();
    try {
      const result = await authRequest<{ lawyer: Lawyer; token: string }>('/demo-login', {
        method: 'POST',
        body: JSON.stringify({ lawyerId }),
      });
      window.localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      window.localStorage.setItem(AUTH_STORAGE_KEY, result.lawyer.id);
      return result.lawyer;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      console.warn('API demo login unavailable; using local workspace session.', error);
    }
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
    try {
      const result = await authRequest<{ lawyer: Lawyer; token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      window.localStorage.setItem(AUTH_STORAGE_KEY, result.lawyer.id);
      return result.lawyer;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      console.warn('API login unavailable; using local workspace session.', error);
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
    try {
      const result = await authRequest<{ lawyer: Lawyer; token: string }>('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      window.localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      window.localStorage.setItem(AUTH_STORAGE_KEY, result.lawyer.id);
      return result.lawyer;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      console.warn('API registration unavailable; using local workspace session.', error);
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
    if (getAuthToken()) {
      try {
        await authRequest<{ ok: boolean }>('/logout', { method: 'POST' });
      } catch (error) {
        console.warn('API logout unavailable; clearing local session.', error);
      }
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  async listCases(includeArchived = false): Promise<Case[]> {
    await wait();
    const remote = await caseRequest<{ cases: Case[] }>(`?archived=${String(includeArchived)}`);
    if (remote) {
      syncCases(remote.cases);
      return clone(remote.cases);
    }
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) return [];
    return workspace.cases.filter(
      (item) => item.ownerId === lawyer.id && item.archived === includeArchived,
    );
  },

  async getCase(caseId: string): Promise<Case | undefined> {
    await wait();
    try {
      const remote = await caseRequest<{ case: Case }>(`/${encodeURIComponent(caseId)}`);
      if (remote) {
        syncCase(remote.case);
        return clone(remote.case);
      }
    } catch (error) {
      if (error instanceof HttpRequestError && error.status === 404) return undefined;
      throw error;
    }
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    return workspace.cases.find((item) => item.id === caseId && item.ownerId === lawyer?.id);
  },

  async createCase(input: { title: string; description: string }): Promise<Case> {
    await wait();
    const remote = await caseRequest<{ case: Case }>('/', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (remote) {
      syncCase(remote.case);
      return clone(remote.case);
    }
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
    const remote = await caseRequest<{ case: Case }>(`/${encodeURIComponent(caseId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    if (remote) {
      syncCase(remote.case);
      return clone(remote.case);
    }
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
    const remote = await caseRequest<{ case: Case }>(`/${encodeURIComponent(caseId)}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
    if (remote) {
      syncCase(remote.case);
      return clone(remote.case);
    }
    const { workspace, caseItem } = requireCaseOwner(readWorkspace(), caseId);
    caseItem.archived = archived;
    caseItem.updatedAt = new Date().toISOString();
    writeWorkspace(workspace);
    return clone(caseItem);
  },

  async listDocuments(caseId?: string): Promise<CaseDocument[]> {
    await wait();
    const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    const remote = await documentRequest<{ documents: CaseDocument[] }>(`/documents${query}`);
    if (remote) return clone(remote.documents);
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) return [];
    return workspace.documents.filter(
      (item) => item.ownerId === lawyer.id && !item.deletedAt && (!caseId || item.caseId === caseId),
    );
  },

  async getDocumentPageContent(documentId: string, pageNumber: number): Promise<{
    document: CaseDocument;
    pageNumber: number;
    totalPages: number;
    sectionTitle: string;
    content: string;
  }> {
    await wait();
    try {
      const remote = await documentRequest<{
        document: CaseDocument;
        pageNumber: number;
        totalPages: number;
        sectionTitle: string;
        content: string;
      }>(`/documents/${encodeURIComponent(documentId)}/source?page=${pageNumber}`);
      if (remote) return clone(remote);
    } catch (error) {
      if (error instanceof HttpRequestError && error.status === 404) {
        throw new Error('Document is inaccessible or has been deleted.');
      }
      throw error;
    }
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    const document = workspace.documents.find(
      (item) => item.id === documentId && item.ownerId === lawyer?.id,
    );
    if (!document || document.deletedAt) {
      throw new Error('Document is inaccessible or has been deleted.');
    }
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > document.pageCount) {
      throw new Error(`Page must be between 1 and ${document.pageCount}.`);
    }
    const page = workspace.pageContents[documentId]?.[String(pageNumber)];
    return {
      document: clone(document),
      pageNumber,
      totalPages: document.pageCount,
      sectionTitle: page?.sectionTitle ?? 'Document text',
      content: page?.content ?? `Page ${pageNumber} of ${document.originalName}. This page is available for document review.`,
    };
  },

  async uploadDocument(
    caseId: string,
    file: { name: string; size: number; type: string; simulateFailure?: boolean },
  ): Promise<CaseDocument> {
    await wait();
    const remote = await documentRequest<{ document: CaseDocument; jobId: string }>(
      `/cases/${encodeURIComponent(caseId)}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({ name: file.name, size: file.size, type: file.type }),
      },
    );
    if (remote) return clone(remote.document);
    const workspace = readWorkspace();
    const { caseItem } = requireCaseOwner(workspace, caseId);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Only PDF files with application/pdf type or a .pdf extension are supported.');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('PDF files must be 20 MB or smaller.');
    }
    const document: CaseDocument = {
      id: `document-${Date.now()}`,
      caseId: caseItem.id,
      ownerId: caseItem.ownerId,
      originalName: file.name,
      pageCount: 15 + Math.floor(Math.random() * 31),
      activeVersion: 1,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    workspace.documents.push(document);
    writeWorkspace(workspace);
    return clone(document);
  },

  async updateDocumentStatus(
    documentId: string,
    status: CaseDocument['status'],
    errorCode?: string,
  ): Promise<CaseDocument> {
    await wait(60);
    const remote = await documentRequest<{ document: CaseDocument }>(
      `/documents/${encodeURIComponent(documentId)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status, errorCode }) },
    );
    if (remote) return clone(remote.document);
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    const document = workspace.documents.find((item) => item.id === documentId && item.ownerId === lawyer?.id);
    if (!document || document.deletedAt) {
      throw new Error('Document is inaccessible or has been deleted.');
    }
    document.status = status;
    document.errorCode = errorCode;
    writeWorkspace(workspace);
    return clone(document);
  },

  async retryDocumentJob(documentId: string): Promise<CaseDocument> {
    await wait();
    const remote = await documentRequest<{ document: CaseDocument }>(
      `/documents/${encodeURIComponent(documentId)}/retry`,
      { method: 'POST' },
    );
    if (remote) return clone(remote.document);
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    const document = workspace.documents.find((item) => item.id === documentId && item.ownerId === lawyer?.id);
    if (!document || document.deletedAt || document.status !== 'failed') {
      throw new Error('Only an accessible failed document can be retried.');
    }
    document.status = 'queued';
    delete document.errorCode;
    writeWorkspace(workspace);
    return clone(document);
  },

  async deleteDocument(documentId: string): Promise<void> {
    await wait();
    const remote = await documentRequest<{ ok: boolean; documentId: string }>(
      `/documents/${encodeURIComponent(documentId)}`,
      { method: 'DELETE' },
    );
    if (remote) return;
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    const document = workspace.documents.find((item) => item.id === documentId && item.ownerId === lawyer?.id);
    if (!document || document.deletedAt) {
      throw new Error('Document is inaccessible or has already been deleted.');
    }
    document.deletedAt = new Date().toISOString();
    document.status = 'deleting';
    workspace.savedAnswers = workspace.savedAnswers.map((answer) => ({
      ...answer,
      citations: answer.citations.map((citation) => citation.documentId === documentId
        ? { ...citation, isAvailable: false }
        : citation),
    }));
    workspace.responses = workspace.responses.map((response) => ({
      ...response,
      citations: response.citations.map((citation) => citation.documentId === documentId
        ? { ...citation, isAvailable: false }
        : citation),
    }));
    writeWorkspace(workspace);
  },

  async askQuestion(
    caseId: string,
    input: { question: string; documentIds?: string[]; simulateOutcome?: AnswerStatus },
  ): Promise<QuestionResponse> {
    await wait(250);
    const remote = await documentRequest<{ response: QuestionResponse }>(`/cases/${encodeURIComponent(caseId)}/questions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (remote) return clone(remote.response);
    const workspace = readWorkspace();
    const { caseItem } = requireCaseOwner(workspace, caseId);
    const question = input.question.trim();
    if (!question) {
      throw new Error('Please enter a question.');
    }

    const caseDocuments = workspace.documents.filter(
      (document) => document.caseId === caseId && document.ownerId === caseItem.ownerId && !document.deletedAt,
    );
    const requestedIds = input.documentIds ?? caseDocuments.filter((document) => document.status === 'ready').map((document) => document.id);
    const scopedDocuments = requestedIds.map((documentId) => caseDocuments.find((document) => document.id === documentId));
    if (scopedDocuments.some((document) => !document || document.status !== 'ready')) {
      throw new Error('Every selected document must belong to this case and be ready for search.');
    }
    const readyDocuments = scopedDocuments.filter((document): document is CaseDocument => Boolean(document));

    if (input.simulateOutcome === 'error') {
      throw new Error('RAG service timed out while contacting the model provider. Please retry.');
    }

    const responseBase = {
      id: `response-${Date.now()}`,
      caseId,
      question,
      retrievalConfigVersion: 'rag-2025-01',
      createdAt: new Date().toISOString(),
    };
    const isUnrelated = /\b(unrelated|tax|criminal)\b/i.test(question);
    if (!readyDocuments.length || input.simulateOutcome === 'insufficient_evidence' || isUnrelated) {
      const response: QuestionResponse = {
        ...responseBase,
        status: 'insufficient_evidence',
        answer: 'I cannot answer this question from the selected, indexed case documents. I am abstaining rather than inferring beyond the available evidence.',
        citations: [],
        limitations: 'Add or select a ready source containing directly relevant language, then retry.',
      };
      workspace.responses.unshift(response);
      writeWorkspace(workspace);
      return clone(response);
    }

    const citationCandidates: Citation[] = [];
    readyDocuments.forEach((document) => {
      const pages = Object.keys(workspace.pageContents[document.id] ?? {}).map(Number).sort((a, b) => a - b);
      const preferredPage: Record<string, number> = {
        'document-1': 42,
        'document-3': 18,
        'document-4': 55,
      };
      const page = preferredPage[document.id] && pages.includes(preferredPage[document.id])
        ? preferredPage[document.id]
        : pages[0] ?? 1;
      const content = workspace.pageContents[document.id]?.[String(page)]?.content
        ?? `Page ${page} of ${document.originalName} is ready for review.`;
      citationCandidates.push({
        sourceId: `S${citationCandidates.length + 1}`,
        documentId: document.id,
        documentName: document.originalName,
        version: document.activeVersion,
        chunkId: `chunk-${String(page).padStart(3, '0')}`,
        physicalPage: page,
        excerpt: content,
        isAvailable: true,
      });
    });
    const citations = citationCandidates.slice(0, Math.min(2, citationCandidates.length));
    const isPartial = input.simulateOutcome === 'partial';
    const response: QuestionResponse = {
      ...responseBase,
      status: isPartial ? 'partial' : 'answered',
      answer: isPartial
        ? `The indexed documents provide a likely answer to this question [${citations[0].sourceId}], but the available record does not resolve every issue.`
        : `Based on the selected case documents, the relevant provision addresses this issue directly [${citations[0].sourceId}]. Review the cited page for the controlling language.`,
      citations,
      limitations: isPartial ? 'Some potentially relevant documents or provisions are not indexed in the selected scope.' : undefined,
    };
    workspace.responses.unshift(response);
    writeWorkspace(workspace);
    return clone(response);
  },

  async listResponses(caseId?: string): Promise<QuestionResponse[]> {
    await wait();
    const remote = await documentRequest<{ responses: QuestionResponse[] }>(
      `/questions${caseId ? `?caseId=${encodeURIComponent(caseId)}` : ''}`,
    );
    if (remote) return clone(remote.responses);
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

  async listConversations(caseId: string): Promise<QuestionResponse[]> {
    await wait();
    const remote = await documentRequest<{ responses: QuestionResponse[] }>(
      `/conversations?caseId=${encodeURIComponent(caseId)}`,
    );
    if (remote) return clone(remote.responses);
    return this.listResponses(caseId);
  },

  async listSavedAnswers(caseId?: string): Promise<SavedAnswer[]> {
    await wait();
    const remote = await documentRequest<{ savedAnswers: SavedAnswer[] }>(
      `/saved-answers${caseId ? `?caseId=${encodeURIComponent(caseId)}` : ''}`,
    );
    if (remote) return clone(remote.savedAnswers);
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) return [];
    return workspace.savedAnswers
      .filter((item) => item.ownerId === lawyer.id && (!caseId || item.caseId === caseId))
      .map((item) => ({
        ...item,
        citations: item.citations.map((citation) => ({
          ...citation,
          isAvailable: citation.isAvailable && Boolean(
            workspace.documents.find((document) => document.id === citation.documentId && !document.deletedAt),
          ),
        })),
      }));
  },

  async saveAnswer(answer: SavedAnswer): Promise<SavedAnswer> {
    await wait();
    const remote = await documentRequest<{ savedAnswer: SavedAnswer }>(
      `/cases/${encodeURIComponent(answer.caseId)}/saved-answers`,
      {
        method: 'POST',
        body: JSON.stringify({
          question: answer.question,
          answer: answer.answer,
          citations: answer.citations,
        }),
      },
    );
    if (remote) return clone(remote.savedAnswer);
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer || answer.ownerId !== lawyer.id) {
      throw new Error('You can only save answers in your own workspace.');
    }
    if (!workspace.cases.some((item) => item.id === answer.caseId && item.ownerId === lawyer.id)) {
      throw new Error('Case not found or inaccessible.');
    }
    workspace.savedAnswers.push(clone(answer));
    writeWorkspace(workspace);
    return clone(answer);
  },

  async deleteSavedAnswer(savedAnswerId: string): Promise<void> {
    await wait();
    const remote = await documentRequest<{ ok: boolean }>(
      `/saved-answers/${encodeURIComponent(savedAnswerId)}`,
      { method: 'DELETE' },
    );
    if (remote) return;
    const workspace = readWorkspace();
    const lawyer = requireAuthenticatedLawyer(workspace);
    if (!lawyer) throw new Error('You must be signed in to delete a saved answer.');
    workspace.savedAnswers = workspace.savedAnswers.filter((answer) =>
      !(answer.id === savedAnswerId && answer.ownerId === lawyer.id));
    writeWorkspace(workspace);
  },

  async reset(): Promise<void> {
    await wait();
    writeWorkspace(clone(seedData));
  },
};
