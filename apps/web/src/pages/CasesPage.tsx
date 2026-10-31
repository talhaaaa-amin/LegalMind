import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Clock3, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Case, CaseDocument } from '../types/contracts';

export function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);

  useEffect(() => {
    void Promise.all([apiClient.listCases(), apiClient.listDocuments()]).then(([loadedCases, loadedDocuments]) => {
      setCases(loadedCases);
      setDocuments(loadedDocuments);
    });
  }, []);

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-teal">Your matters</p>
          <h1 className="mt-2 font-display text-4xl text-navy">Cases</h1>
          <p className="mt-2 text-sm text-slate-500">Manage matter context and the documents powering your answers.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal/90">
          <Plus size={17} /> New case
        </button>
      </div>

      <div className="mt-9 grid gap-5 md:grid-cols-2">
        {cases.map((item) => {
          const caseDocuments = documents.filter((document) => document.caseId === item.id);
          const readyCount = caseDocuments.filter((document) => document.status === 'ready').length;
          return (
            <Link key={item.id} to={`/cases/${item.id}`} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal">
                  <BriefcaseBusiness size={19} />
                </div>
                <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal" />
              </div>
              <h2 className="mt-6 text-lg font-semibold text-navy">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>
              <div className="mt-6 flex items-center gap-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span>{caseDocuments.length} documents</span>
                <span>{readyCount} indexed</span>
                <span className="ml-auto flex items-center gap-1"><Clock3 size={13} /> Updated recently</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
