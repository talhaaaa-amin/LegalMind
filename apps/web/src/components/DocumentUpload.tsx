import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { FileUp, LoaderCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import type { CaseDocument } from '../types/contracts';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const lifecycle: CaseDocument['status'][] = ['extracting', 'indexing', 'ready'];

export async function simulateDocumentLifecycle(
  document: CaseDocument,
  onUpdate: (document: CaseDocument) => void,
  simulateFailure = false,
) {
  let current = document;
  for (let index = 0; index < lifecycle.length; index += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    if (simulateFailure && index === 0) {
      current = await apiClient.updateDocumentStatus(current.id, 'failed', 'EXTRACTION_OCR_REQUIRED');
      onUpdate(current);
      return;
    }
    current = await apiClient.updateDocumentStatus(current.id, lifecycle[index]);
    onUpdate(current);
  }
}

interface DocumentUploadProps {
  caseId: string;
  onUploaded: (document: CaseDocument) => void;
}

export function DocumentUpload({ caseId, onUploaded }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Choose a PDF file with application/pdf type or a .pdf extension.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('PDF files must be 20 MB or smaller.');
      return;
    }
    setIsUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = '';
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      const document = await apiClient.uploadDocument(caseId, {
        name: file.name,
        size: file.size,
        type: file.type,
        content: `base64:${window.btoa(binary)}`,
        simulateFailure,
      });
      onUploaded(document);
      void simulateDocumentLifecycle(document, onUploaded, simulateFailure).catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Document processing failed.');
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5">
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-5 py-7 text-center transition ${isDragging ? 'border-teal bg-teal/5' : 'border-slate-200 bg-white hover:border-teal/50'}`}
      >
        {isUploading ? <LoaderCircle className="mx-auto animate-spin text-teal" size={24} /> : <FileUp className="mx-auto text-teal" size={24} />}
        <p className="mt-3 text-sm font-semibold text-slate-700">Drop a PDF here or click to browse</p>
        <p className="mt-1 text-xs text-slate-400">PDF only · Maximum 20 MB</p>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={onInputChange} className="hidden" />
      </div>
      <label className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} className="rounded border-slate-300 text-teal focus:ring-teal" />
        Simulate extraction failure (for testing retry)
      </label>
      {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
