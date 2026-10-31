import { useEffect, useState, type FormEvent } from 'react';
import {
  Archive,
  ArrowLeft,
  Edit3,
  FileText,
  RefreshCw,
  RotateCcw,
  Save,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { DocumentUpload, simulateDocumentLifecycle } from '../components/DocumentUpload';
import { AskDocumentsPanel } from '../components/AskDocumentsPanel';
import { SourceViewer } from '../components/SourceViewer';
import type { Case, CaseDocument, QuestionResponse, SavedAnswer } from '../types/contracts';

type WorkspaceTab = 'documents' | 'ask' | 'saved';

export function CaseDetailPage() {
  const { caseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: WorkspaceTab = requestedTab === 'ask' || requestedTab === 'saved' ? requestedTab : 'documents';
  const [caseItem, setCaseItem] = useState<Case>();
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sourceDocumentId, setSourceDocumentId] = useState(searchParams.get('doc') ?? '');
  const [sourcePage, setSourcePage] = useState(Number(searchParams.get('page')) || 1);

  const loadWorkspace = () => {
    if (!caseId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void Promise.all([
      apiClient.getCase(caseId),
      apiClient.listDocuments(caseId),
      apiClient.listResponses(caseId),
      apiClient.listSavedAnswers(caseId),
    ]).then(([loadedCase, loadedDocuments, loadedResponses, loadedSavedAnswers]) => {
      setCaseItem(loadedCase);
      setDocuments(loadedDocuments);
      setResponses(loadedResponses);
      setSavedAnswers(loadedSavedAnswers);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadWorkspace();
  }, [caseId]);

  const setTab = (tab: WorkspaceTab) => {
    setSearchParams(tab === 'documents' ? {} : { tab });
  };

  const openSource = (documentId: string, pageNumber = 1) => {
    setSourceDocumentId(documentId);
    setSourcePage(pageNumber);
    setSearchParams({ tab: activeTab, doc: documentId, page: String(pageNumber) });
  };

  const updateDocument = (updatedDocument: CaseDocument) => {
    setDocuments((current) => current.some((item) => item.id === updatedDocument.id)
      ? current.map((item) => item.id === updatedDocument.id ? updatedDocument : item)
      : [...current, updatedDocument]);
  };

  const retryDocument = (document: CaseDocument) => {
    void apiClient.retryDocumentJob(document.id)
      .then((queuedDocument) => {
        updateDocument(queuedDocument);
        return simulateDocumentLifecycle(queuedDocument, updateDocument);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to retry document processing.'));
  };

  const deleteDocument = (document: CaseDocument) => {
    if (!window.confirm(`Delete ${document.originalName}? Its citations will remain visible but unavailable.`)) return;
    void apiClient.deleteDocument(document.id).then(() => {
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      if (sourceDocumentId === document.id) {
        setSourceDocumentId('');
        setSearchParams({ tab: 'documents' });
      }
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to delete document.'));
  };

  const openEdit = () => {
    if (!caseItem) return;
    setForm({ title: caseItem.title, description: caseItem.description });
    setError('');
    setIsEditing(true);
  };

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!caseItem) return;
    setIsSaving(true);
    setError('');
    void apiClient.updateCase(caseItem.id, form)
      .then((updatedCase) => {
        setCaseItem(updatedCase);
        setIsEditing(false);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to save case.'))
      .finally(() => setIsSaving(false));
  };

  const toggleArchived = () => {
    if (!caseItem) return;
    void apiClient.setCaseArchived(caseItem.id, !caseItem.archived).then(setCaseItem);
  };

  if (isLoading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading case...</div>;
  }

  if (!caseItem) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <TriangleAlert className="mx-auto text-amber-500" size={30} />
        <h1 className="mt-4 font-display text-3xl text-navy">Case Inaccessible or Not Found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">This matter does not exist or you do not have permission to access it.</p>
        <Link to="/cases" className="mt-6 inline-flex rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90">Back to cases</Link>
      </div>
    );
  }

  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: 'documents', label: 'Documents' },
    { id: 'ask', label: 'Ask Documents' },
    { id: 'saved', label: 'Saved Answers' },
  ];

  return (
    <section>
      <Link to="/cases" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal">
        <ArrowLeft size={16} /> All cases
      </Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-teal">Case workspace</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${caseItem.archived ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
              {caseItem.archived ? 'Archived' : 'Active'}
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl text-navy">{caseItem.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{caseItem.description || 'No description provided.'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openEdit} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-teal/40 hover:text-teal"><Edit3 size={15} /> Edit Matter</button>
          <button onClick={toggleArchived} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-teal/40 hover:text-teal">
            {caseItem.archived ? <RotateCcw size={15} /> : <Archive size={15} />} {caseItem.archived ? 'Restore' : 'Archive'}
          </button>
        </div>
      </div>

      <div className="mt-9 border-b border-slate-200">
        <nav className="flex gap-6" aria-label="Case workspace tabs">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setTab(tab.id)} className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${activeTab === tab.id ? 'border-teal text-teal' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'documents' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-navy">Documents</h2>
              <span className="text-xs text-slate-400">{documents.length} files</span>
            </div>
            <div className="mt-5">
              <DocumentUpload caseId={caseItem.id} onUploaded={updateDocument} />
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FileText size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{document.originalName}</p>
                    <p className="mt-1 text-xs text-slate-400">{document.pageCount} pages · Version {document.activeVersion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocumentStatusBadge document={document} />
                    {document.status === 'failed' && <button onClick={() => retryDocument(document)} className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"><RefreshCw size={13} /> Retry</button>}
                    {document.status !== 'deleting' && <button onClick={() => openSource(document.id, 1)} className="text-xs font-semibold text-slate-600 hover:text-teal">View Source</button>}
                    <button onClick={() => deleteDocument(document)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        )}

        {activeTab === 'ask' && (
          <AskDocumentsPanel
            caseItem={caseItem}
            documents={documents}
            initialResponses={responses}
            onOpenSource={openSource}
          />
        )}

        {activeTab === 'saved' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">Saved answers</h2>
            {savedAnswers.length === 0 ? <p className="mt-5 text-sm text-slate-500">Saved answers from your research will appear here.</p> : (
              <div className="mt-5 space-y-4">
                {savedAnswers.map((answer) => (
                  <div key={answer.id} className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium leading-5 text-slate-700">{answer.question}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{answer.answer}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-teal">{answer.citations.length} citation{answer.citations.length === 1 ? '' : 's'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/40 px-4" role="dialog" aria-modal="true" aria-labelledby="edit-matter-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-semibold text-teal">Edit matter</p><h2 id="edit-matter-title" className="mt-1 font-display text-3xl text-navy">Update case details</h2></div>
              <button onClick={() => setIsEditing(false)} aria-label="Close dialog" className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">Title
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Description
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button disabled={isSaving} className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50"><Save size={15} /> {isSaving ? 'Saving...' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {sourceDocumentId && (
        <SourceViewer
          documentId={sourceDocumentId}
          pageNumber={sourcePage}
          onPageChange={(pageNumber) => {
            setSourcePage(pageNumber);
            setSearchParams({ tab: 'documents', doc: sourceDocumentId, page: String(pageNumber) });
          }}
          onClose={() => {
            setSourceDocumentId('');
            setSearchParams({ tab: 'documents' });
          }}
        />
      )}
    </section>
  );
}
