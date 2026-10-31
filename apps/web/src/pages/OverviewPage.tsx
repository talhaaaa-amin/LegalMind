import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, FileCheck2, Sparkles } from 'lucide-react';

export function OverviewPage() {
  return (
    <section>
      <div className="rounded-2xl bg-navy px-8 py-10 text-white shadow-lg">
        <p className="text-sm font-semibold text-teal-300">Good morning, Amelia</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight">Find the answer. Know exactly where it came from.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">LegalMind keeps your matter documents, retrieval context, and cited answers in one private workspace built for counsel.</p>
        <Link to="/cases" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-slate-100">Open cases <ArrowRight size={16} /></Link>
      </div>
      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {[
          { icon: BookOpen, label: 'Matter context', value: '2 active cases', text: 'Keep every research question grounded.' },
          { icon: FileCheck2, label: 'Indexed sources', value: '1 ready document', text: 'Every answer traces back to evidence.' },
          { icon: Sparkles, label: 'Retrieval engine', value: 'Online', text: 'Your private workspace is ready.' },
        ].map(({ icon: Icon, label, value, text }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon size={19} className="text-teal" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 font-semibold text-navy">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
