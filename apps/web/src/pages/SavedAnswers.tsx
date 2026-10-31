import { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, ExternalLink, TriangleAlert } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { SourceViewer } from '../components/SourceViewer';
import type { Case, SavedAnswer } from '../types/contracts';

export function SavedAnswers() {
  const { caseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseItem, setCaseItem] = useState<Case>();
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sourceDocumentId = searchParams.get('doc') ?? '';
  const sourcePage = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    if (!caseId) {
      setIsLoading(false);
      return;
    }
    void Promise.all([apiClient.getCase(caseId), apiClient.listSavedAnswers(caseId)])
      .then(([loadedCase, loadedAnswers]) => {
        setCaseItem(loadedCase);
        setAnswers(loadedAnswers);
      })
      .finally(() => setIsLoading(false));
  }, [caseId]);

  if (isLoading) return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading saved answers...</div>;
  if (!caseItem || !caseId) {
    return <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><TriangleAlert className="mx-auto text-amber-500" size={30} /><h1 className="mt-4 font-display text-3xl text-navy">Case Inaccessible or Not Found</h1><Link to="/cases" className="mt-6 inline-flex rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white">Back to cases</Link></div>;
  }

  return (
    <section>
      <Link to={`/cases/${caseId}?tab=saved`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal"><ArrowLeft size={16} /> Back to case workspace</Link>
      <div className="mt-6"><p className="text-sm font-semibold text-teal">Case workspace</p><h1 className="mt-2 font-display text-4xl text-navy">Saved Answers</h1><p className="mt-2 text-sm text-slate-500">{caseItem.title}</p></div>
      <div className="mt-8 space-y-4">
        {answers.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Saved answers for this case will appear here.</div>}
        {answers.map((answer) => (
          <article key={answer.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-teal">Saved question</p><h2 className="mt-2 text-base font-semibold text-navy">{answer.question}</h2></div><Bookmark size={18} className="fill-teal text-teal" /></div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{answer.answer}</p>
            <p className="mt-4 text-xs text-slate-400">{new Date(answer.createdAt).toLocaleString()}</p>
            {answer.citations.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cited sources</h3><div className="mt-3 space-y-2">{answer.citations.map((citation) => <button key={citation.sourceId} disabled={!citation.isAvailable} onClick={() => citation.isAvailable && setSearchParams({ doc: citation.documentId, page: String(citation.physicalPage) })} className={`flex w-full items-center justify-between rounded-lg p-3 text-left text-xs ${citation.isAvailable ? 'bg-slate-50 hover:bg-teal/5' : 'bg-red-50 text-red-600'}`}><span><strong className="text-teal">[{citation.sourceId}]</strong> {citation.documentName}<span className="ml-2 text-slate-400">Page {citation.physicalPage}</span></span><span className="flex items-center gap-1 font-semibold">{citation.isAvailable ? <><ExternalLink size={13} /> View source</> : 'Source Unavailable (Deleted)'}</span></button>)}</div></div>}
          </article>
        ))}
      </div>
      {sourceDocumentId && <SourceViewer documentId={sourceDocumentId} pageNumber={sourcePage} onPageChange={(page) => setSearchParams({ doc: sourceDocumentId, page: String(page) })} onClose={() => setSearchParams({})} />}
    </section>
  );
}
