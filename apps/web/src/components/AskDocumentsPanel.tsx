import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Bookmark, CheckCircle2, FileSearch, Info, RotateCcw, Send, ShieldAlert } from 'lucide-react';
import { apiClient } from '../api/client';
import { ConversationList } from './ConversationList';
import type { AnswerStatus, Case, CaseDocument, Citation, QuestionResponse, SavedAnswer } from '../types/contracts';

type Simulation = 'auto' | AnswerStatus;

interface AskDocumentsPanelProps {
  caseItem: Case;
  documents: CaseDocument[];
  initialResponses: QuestionResponse[];
  onOpenSource: (documentId: string, pageNumber: number) => void;
}

const simulationOptions: { value: Simulation; label: string }[] = [
  { value: 'auto', label: 'Auto (based on question & docs)' },
  { value: 'partial', label: 'Force Partial Answer' },
  { value: 'insufficient_evidence', label: 'Force Insufficient Evidence' },
  { value: 'error', label: 'Force Service Error' },
];

const promptsByCase: Record<string, string[]> = {
  'case-1': ['What notice period is required before termination?', 'Compare payment obligations with invoice records', 'What is the governing law?'],
  'case-2': ['Is the non-solicitation clause time-limited?', 'What restrictions apply after termination?', 'What is the governing law?'],
  'case-3': ['Which representations survive the closing date?', 'Compare payment obligations with invoice records', 'What is the governing law?'],
};

function statusLabel(status: AnswerStatus) {
  return status === 'insufficient_evidence' ? 'Insufficient evidence' : status === 'answered' ? 'Answered' : 'Partial answer';
}

function AnswerText({ answer, citations, onOpenSource }: { answer: string; citations: Citation[]; onOpenSource: AskDocumentsPanelProps['onOpenSource'] }) {
  return (
    <p className="text-sm leading-7 text-slate-600">
      {answer.split(/(\[S\d+\])/g).map((part, index) => {
        const citation = citations.find((item) => item.sourceId === part.slice(1, -1));
        if (!citation) return <span key={`${part}-${index}`}>{part}</span>;
        return citation.isAvailable ? (
          <button key={`${part}-${index}`} onClick={() => onOpenSource(citation.documentId, citation.physicalPage)} className="mx-1 inline-flex rounded-md bg-teal/10 px-1.5 py-0.5 text-xs font-bold text-teal hover:bg-teal/20">{part}</button>
        ) : (
          <span key={`${part}-${index}`} className="mx-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-400">{part}</span>
        );
      })}
    </p>
  );
}

export function AskDocumentsPanel({ caseItem, documents, initialResponses, onOpenSource }: AskDocumentsPanelProps) {
  const readyDocuments = useMemo(() => documents.filter((document) => document.status === 'ready' && !document.deletedAt), [documents]);
  const unavailableDocuments = documents.filter((document) => document.status === 'indexing' || document.status === 'failed');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [simulation, setSimulation] = useState<Simulation>('auto');
  const [responses, setResponses] = useState(initialResponses);
  const [latestResponse, setLatestResponse] = useState<QuestionResponse>();
  const [serviceError, setServiceError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const [selectedResponseId, setSelectedResponseId] = useState<string>();
  const [savedResponseIds, setSavedResponseIds] = useState<string[]>([]);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setSelectedIds(readyDocuments.map((document) => document.id));
  }, [readyDocuments.map((document) => document.id).join(',')]);

  const ask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuestion(question);
  };

  const submitQuestion = (submittedQuestion: string) => {
    setIsSubmitting(true);
    setServiceError('');
    setLastQuestion(submittedQuestion);
    void apiClient.askQuestion(caseItem.id, {
      question: submittedQuestion,
      documentIds: selectedIds,
      simulateOutcome: simulation === 'auto' ? undefined : simulation,
    }).then((response) => {
      setResponses((current) => [response, ...current]);
      setLatestResponse(response);
      setSelectedResponseId(response.id);
      setLastQuestion(submittedQuestion);
      setQuestion('');
    }).catch((reason: unknown) => {
      setServiceError(reason instanceof Error ? reason.message : 'The RAG service could not answer this question.');
    }).finally(() => setIsSubmitting(false));
  };

  const retry = () => {
    if (lastQuestion) submitQuestion(lastQuestion);
  };

  const toggleDocument = (documentId: string) => {
    setSelectedIds((current) => current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId]);
  };

  const displayResponse = latestResponse ?? responses[0];

  const saveResponse = async (response: QuestionResponse) => {
    setSaveError('');
    try {
      const lawyer = await apiClient.getCurrentLawyer();
      if (!lawyer) throw new Error('Sign in to save an answer.');
      const saved: SavedAnswer = {
        id: `saved-${Date.now()}`,
        caseId: response.caseId,
        ownerId: lawyer.id,
        question: response.question,
        answer: response.answer,
        citations: response.citations,
        createdAt: new Date().toISOString(),
      };
      await apiClient.saveAnswer(saved);
      setSavedResponseIds((current) => [...current, response.id]);
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : 'Unable to save answer.');
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <ConversationList
        responses={responses}
        selectedId={selectedResponseId ?? displayResponse?.id}
        onSelect={(response) => {
          setLatestResponse(response);
          setSelectedResponseId(response.id);
          setServiceError('');
        }}
        onFollowUp={() => {
          setLatestResponse(undefined);
          setSelectedResponseId(undefined);
          setQuestion('');
        }}
      />
      <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><FileSearch size={17} className="text-teal" /><span className="text-sm font-semibold text-navy">Search scope</span><span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">{caseItem.title}</span></div>
          <span className="text-xs text-slate-400">{selectedIds.length} of {readyDocuments.length} ready sources selected</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {readyDocuments.map((document) => (
            <button key={document.id} onClick={() => toggleDocument(document.id)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedIds.includes(document.id) ? 'border-teal bg-teal/10 text-teal' : 'border-slate-200 text-slate-400'}`}>
              {selectedIds.includes(document.id) ? '✓ ' : ''}{document.originalName}
            </button>
          ))}
          {!readyDocuments.length && <span className="text-xs text-slate-400">No ready documents are available for search.</span>}
        </div>
        {unavailableDocuments.length > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Info size={14} className="text-amber-500" /> {unavailableDocuments.length} document{unavailableDocuments.length === 1 ? '' : 's'} still indexing or failed; excluded from search scope.</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(promptsByCase[caseItem.id] ?? ['What does the case record say about this issue?']).map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-teal/10 hover:text-teal">{prompt}</button>)}
        </div>
        <form onSubmit={ask} className="mt-4">
          <textarea required value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} placeholder="Ask a question about the documents in this case..." className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">Developer test outcome
              <select value={simulation} onChange={(event) => setSimulation(event.target.value as Simulation)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-teal">
                {simulationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button disabled={isSubmitting || !selectedIds.length} className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50"><Send size={15} /> {isSubmitting ? 'Searching...' : 'Ask Documents'}</button>
          </div>
        </form>
      </div>

      {serviceError && <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span className="flex items-center gap-2"><AlertCircle size={17} /> {serviceError}</span><button onClick={retry} className="flex items-center gap-1 font-semibold hover:underline"><RotateCcw size={14} /> Retry Question</button></div>}

      {displayResponse && !serviceError && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            {displayResponse.status === 'answered' ? <CheckCircle2 size={17} className="text-emerald-600" /> : displayResponse.status === 'partial' ? <Info size={17} className="text-amber-600" /> : <ShieldAlert size={17} className="text-slate-500" />}
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${displayResponse.status === 'answered' ? 'bg-emerald-50 text-emerald-700' : displayResponse.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{statusLabel(displayResponse.status)}</span>
            </div>
            <button disabled={savedResponseIds.includes(displayResponse.id)} onClick={() => void saveResponse(displayResponse)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal/40 hover:text-teal disabled:opacity-60">
              <Bookmark size={14} className={savedResponseIds.includes(displayResponse.id) ? 'fill-teal text-teal' : ''} /> {savedResponseIds.includes(displayResponse.id) ? 'Saved' : 'Save Answer'}
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{displayResponse.question}</p>
          {displayResponse.status === 'insufficient_evidence' && <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">LegalMind abstained because the selected sources do not contain enough directly relevant evidence.</div>}
          <div className="mt-4"><AnswerText answer={displayResponse.answer} citations={displayResponse.citations} onOpenSource={onOpenSource} /></div>
          {displayResponse.limitations && <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>Limitation:</strong> {displayResponse.limitations}</div>}
          {displayResponse.citations.length > 0 && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Supporting evidence & citations</h3><div className="mt-3 space-y-3">{displayResponse.citations.map((citation) => <button key={citation.sourceId} disabled={!citation.isAvailable} onClick={() => citation.isAvailable && onOpenSource(citation.documentId, citation.physicalPage)} className={`block w-full rounded-lg p-4 text-left ${citation.isAvailable ? 'bg-slate-50 hover:bg-teal/5' : 'bg-slate-50 opacity-70'}`}><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-teal">[{citation.sourceId}] {citation.documentName}</span><span className="text-[11px] text-slate-400">Version {citation.version} · Page {citation.physicalPage}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">“{citation.excerpt}”</p><span className="mt-2 inline-block text-[11px] font-semibold text-slate-400">{citation.isAvailable ? 'View source' : 'Source unavailable'}</span></button>)}</div></div>}
        </div>
      )}
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
      </div>
    </div>
  );
}
