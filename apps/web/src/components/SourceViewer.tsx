import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { apiClient } from '../api/client';
import type { CaseDocument } from '../types/contracts';

interface SourceViewerProps {
  documentId: string;
  pageNumber: number;
  onPageChange: (pageNumber: number) => void;
  onClose: () => void;
}

export function SourceViewer({ documentId, pageNumber, onPageChange, onClose }: SourceViewerProps) {
  const [document, setDocument] = useState<CaseDocument>();
  const [totalPages, setTotalPages] = useState(0);
  const [sectionTitle, setSectionTitle] = useState('');
  const [content, setContent] = useState('');
  const [inputPage, setInputPage] = useState(String(pageNumber));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setInputPage(String(pageNumber));
    setIsLoading(true);
    setError('');
    void apiClient.getDocumentPageContent(documentId, pageNumber)
      .then((page) => {
        setDocument(page.document);
        setTotalPages(page.totalPages);
        setSectionTitle(page.sectionTitle);
        setContent(page.content);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load this source.'))
      .finally(() => setIsLoading(false));
  }, [documentId, pageNumber]);

  const goToPage = (value: string) => {
    const nextPage = Number(value);
    if (Number.isInteger(nextPage) && nextPage >= 1 && nextPage <= totalPages) {
      onPageChange(nextPage);
    } else {
      setInputPage(String(pageNumber));
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl" aria-label="PDF source viewer">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal"><FileText size={14} /> Source viewer</div>
          <h2 className="mt-2 truncate text-sm font-semibold text-navy">{document?.originalName ?? 'Document source'}</h2>
          {document && <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Version {document.activeVersion}</span>}
        </div>
        <button onClick={onClose} aria-label="Close source viewer" className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
      </div>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
        <button disabled={pageNumber <= 1 || isLoading} onClick={() => onPageChange(pageNumber - 1)} className="flex items-center gap-1 text-xs font-semibold text-slate-600 disabled:opacity-30"><ChevronLeft size={15} /> Prev</button>
        <label className="flex items-center gap-2 text-xs text-slate-500">Page <input type="number" min={1} max={totalPages} value={inputPage} onChange={(event) => setInputPage(event.target.value)} onBlur={(event) => goToPage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') goToPage(event.currentTarget.value); }} className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-sm text-slate-700 outline-none focus:border-teal" /> of {totalPages || '—'}</label>
        <button disabled={!totalPages || pageNumber >= totalPages || isLoading} onClick={() => onPageChange(pageNumber + 1)} className="flex items-center gap-1 text-xs font-semibold text-slate-600 disabled:opacity-30">Next <ChevronRight size={15} /></button>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
        {isLoading && <div className="rounded-lg bg-white p-8 text-center text-sm text-slate-500">Loading source page...</div>}
        {!isLoading && error && <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">{error}</div>}
        {!isLoading && !error && (
          <article className="mx-auto min-h-[680px] max-w-xl bg-[#fffdf8] px-10 py-12 shadow-md ring-1 ring-slate-200">
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{document?.originalName}</p>
            <div className="mt-10 border-b border-slate-300 pb-3"><h3 className="font-serif text-lg font-bold text-slate-800">{sectionTitle}</h3><p className="mt-1 text-xs text-slate-400">Page {pageNumber}</p></div>
            <p className="mt-8 font-serif text-[15px] leading-8 text-slate-800">{content}</p>
            <div className="mt-12 border-t border-slate-200 pt-4 text-[10px] text-slate-400">LegalMind source preview · page {pageNumber}</div>
          </article>
        )}
      </div>
    </aside>
  );
}
