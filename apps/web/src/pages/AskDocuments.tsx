import { useEffect, useState } from 'react';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { AskDocumentsPanel } from '../components/AskDocumentsPanel';
import { SourceViewer } from '../components/SourceViewer';
import type { Case, CaseDocument, QuestionResponse } from '../types/contracts';

export function AskDocuments() {
  const { caseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseItem, setCaseItem] = useState<Case>();
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const documentId = searchParams.get('doc') ?? '';
  const pageNumber = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    if (!caseId) {
      setIsLoading(false);
      return;
    }

    void Promise.all([
      apiClient.getCase(caseId),
      apiClient.listDocuments(caseId),
      apiClient.listResponses(caseId),
    ]).then(([loadedCase, loadedDocuments, loadedResponses]) => {
      setCaseItem(loadedCase);
      setDocuments(loadedDocuments);
      setResponses(loadedResponses);
    }).finally(() => setIsLoading(false));
  }, [caseId]);

  if (isLoading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading Ask Documents...</div>;
  }

  if (!caseItem || !caseId) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <TriangleAlert className="mx-auto text-amber-500" size={30} />
        <h1 className="mt-4 font-display text-3xl text-navy">Case Inaccessible or Not Found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">This matter does not exist or you do not have permission to access it.</p>
        <Link to="/cases" className="mt-6 inline-flex rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90">Back to cases</Link>
      </div>
    );
  }

  const openSource = (sourceDocumentId: string, sourcePage: number) => {
    setSearchParams({ doc: sourceDocumentId, page: String(sourcePage) });
  };

  return (
    <section>
      <Link to={`/cases/${caseId}?tab=ask`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal">
        <ArrowLeft size={16} /> Back to case workspace
      </Link>
      <div className="mt-6">
        <p className="text-sm font-semibold text-teal">Case workspace</p>
        <h1 className="mt-2 font-display text-4xl text-navy">Ask Documents</h1>
        <p className="mt-2 text-sm text-slate-500">Ask grounded questions about the indexed documents in {caseItem.title}.</p>
      </div>
      <div className="mt-8">
        <AskDocumentsPanel
          caseItem={caseItem}
          documents={documents}
          initialResponses={responses}
          onOpenSource={openSource}
        />
      </div>
      {documentId && (
        <SourceViewer
          documentId={documentId}
          pageNumber={pageNumber}
          onPageChange={(nextPage) => setSearchParams({ doc: documentId, page: String(nextPage) })}
          onClose={() => setSearchParams({})}
        />
      )}
    </section>
  );
}
