import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, LoaderCircle, TriangleAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Case, CaseDocument, QuestionResponse } from '../types/contracts';

const statusLabel: Record<CaseDocument['status'], string> = {
  uploaded: 'Uploaded',
  queued: 'Queued',
  extracting: 'Extracting',
  indexing: 'Indexing',
  ready: 'Ready',
  failed: 'Failed',
  deleting: 'Deleting',
};

export function CaseDetailPage() {
  const { caseId } = useParams();
  const [caseItem, setCaseItem] = useState<Case>();
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);

  useEffect(() => {
    if (!caseId) return;
    void Promise.all([apiClient.getCase(caseId), apiClient.listDocuments(caseId), apiClient.listResponses(caseId)]).then(
      ([loadedCase, loadedDocuments, loadedResponses]) => {
        setCaseItem(loadedCase);
        setDocuments(loadedDocuments);
        setResponses(loadedResponses);
      },
    );
  }, [caseId]);

  if (!caseItem) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading case...</div>;
  }

  return (
    <section>
      <Link to="/cases" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal">
        <ArrowLeft size={16} /> All cases
      </Link>
      <div className="mt-6">
        <p className="text-sm font-semibold text-teal">Case workspace</p>
        <h1 className="mt-2 font-display text-4xl text-navy">{caseItem.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{caseItem.description}</p>
      </div>
      <div className="mt-9 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Documents</h2>
            <span className="text-xs text-slate-400">{documents.length} files</span>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FileText size={17} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{document.originalName}</p>
                  <p className="mt-1 text-xs text-slate-400">{document.pageCount} pages · Version {document.activeVersion}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${document.status === 'ready' ? 'text-emerald-600' : document.status === 'failed' ? 'text-red-500' : 'text-amber-600'}`}>
                  {document.status === 'ready' ? <CheckCircle2 size={14} /> : document.status === 'failed' ? <TriangleAlert size={14} /> : <LoaderCircle size={14} className="animate-spin" />}
                  {statusLabel[document.status]}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">Recent questions</h2>
          <div className="mt-5 space-y-4">
            {responses.map((response) => (
              <div key={response.id} className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium leading-5 text-slate-700">{response.question}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{response.answer}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-teal">{response.citations.length} citation{response.citations.length === 1 ? '' : 's'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
