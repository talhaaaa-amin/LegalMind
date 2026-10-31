import { AlertTriangle, CheckCircle2, LoaderCircle, UploadCloud } from 'lucide-react';
import type { CaseDocument } from '../types/contracts';

const labels: Record<CaseDocument['status'], string> = {
  uploaded: 'Uploaded',
  queued: 'Queued',
  extracting: 'Extracting',
  indexing: 'Indexing',
  ready: 'Ready',
  failed: 'Failed',
  deleting: 'Deleting',
};

export function DocumentStatusBadge({ document }: { document: CaseDocument }) {
  const isFailed = document.status === 'failed';
  const isReady = document.status === 'ready';
  return (
    <span
      title={isFailed ? document.errorCode ?? 'Document processing failed' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        isReady
          ? 'bg-emerald-50 text-emerald-700'
          : isFailed
            ? 'bg-red-50 text-red-600'
            : document.status === 'deleting'
              ? 'bg-slate-100 text-slate-500'
              : 'bg-amber-50 text-amber-700'
      }`}
    >
      {isReady ? <CheckCircle2 size={13} /> : isFailed ? <AlertTriangle size={13} /> : document.status === 'uploaded' ? <UploadCloud size={13} /> : <LoaderCircle size={13} className={document.status === 'deleting' ? undefined : 'animate-spin'} />}
      <span>{labels[document.status]}</span>
      {isFailed && document.errorCode && <span className="font-normal">· {document.errorCode}</span>}
    </span>
  );
}
