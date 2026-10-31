import { useEffect, useState, type FormEvent } from 'react';
import {
  Archive,
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Edit3,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Case, CaseDocument } from '../types/contracts';

type CaseForm = { title: string; description: string };

export function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingCase, setEditingCase] = useState<Case>();
  const [form, setForm] = useState<CaseForm>({ title: '', description: '' });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadCases = () => {
    void Promise.all([
      apiClient.listCases(includeArchived),
      apiClient.listDocuments(),
    ]).then(([loadedCases, loadedDocuments]) => {
      setCases(loadedCases);
      setDocuments(loadedDocuments);
    });
  };

  useEffect(() => {
    loadCases();
  }, [includeArchived]);

  const openCreate = () => {
    setEditingCase(undefined);
    setForm({ title: '', description: '' });
    setError('');
    setFormMode('create');
  };

  const openEdit = (caseItem: Case) => {
    setEditingCase(caseItem);
    setForm({ title: caseItem.title, description: caseItem.description });
    setError('');
    setFormMode('edit');
  };

  const closeForm = () => {
    if (!isSaving) setFormMode(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const request = formMode === 'create'
      ? apiClient.createCase(form)
      : editingCase
        ? apiClient.updateCase(editingCase.id, form)
        : Promise.reject(new Error('No case selected for editing.'));
    void request
      .then(() => {
        setFormMode(null);
        loadCases();
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to save case.'))
      .finally(() => setIsSaving(false));
  };

  const toggleArchived = (caseItem: Case) => {
    void apiClient.setCaseArchived(caseItem.id, !caseItem.archived).then(loadCases);
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal">Your matters</p>
          <h1 className="mt-2 font-display text-4xl text-navy">Cases</h1>
          <p className="mt-2 text-sm text-slate-500">Manage matter context and the documents powering your answers.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal/90">
          <Plus size={17} /> New case
        </button>
      </div>

      <div className="mt-8 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        {[false, true].map((archived) => (
          <button
            key={String(archived)}
            onClick={() => setIncludeArchived(archived)}
            className={`rounded-md px-4 py-2 transition ${includeArchived === archived ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {archived ? 'Archived Cases' : 'Active Cases'}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {cases.map((item) => {
          const caseDocuments = documents.filter((document) => document.caseId === item.id);
          const readyCount = caseDocuments.filter((document) => document.status === 'ready').length;
          return (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <Link to={`/cases/${item.id}`} className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal">
                  <BriefcaseBusiness size={19} />
                </Link>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.archived ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                  {item.archived ? 'Archived' : 'Active'}
                </span>
              </div>
              <Link to={`/cases/${item.id}`} className="group block">
                <div className="mt-6 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-navy group-hover:text-teal">{item.title}</h2>
                  <ArrowRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description || 'No description provided.'}</p>
              </Link>
              <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span>{caseDocuments.length} documents</span>
                <span>{readyCount} indexed</span>
                <span className="ml-auto flex items-center gap-1"><Clock3 size={13} /> Updated recently</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(item)} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:text-teal">
                  <Edit3 size={13} /> Edit
                </button>
                <button onClick={() => toggleArchived(item)} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:text-teal">
                  {item.archived ? <RotateCcw size={13} /> : <Archive size={13} />}
                  {item.archived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {cases.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {includeArchived ? 'No archived cases.' : 'No active cases yet.'}
        </div>
      )}

      {formMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/40 px-4" role="dialog" aria-modal="true" aria-labelledby="case-form-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-teal">{formMode === 'create' ? 'New matter' : 'Edit matter'}</p>
                <h2 id="case-form-title" className="mt-1 font-display text-3xl text-navy">{formMode === 'create' ? 'Create a case' : 'Update case details'}</h2>
              </div>
              <button onClick={closeForm} aria-label="Close dialog" className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">Title
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" placeholder="e.g. Acme v. Riverstone" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Description
                <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" placeholder="What is this matter about?" />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button disabled={isSaving} className="rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save case'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
