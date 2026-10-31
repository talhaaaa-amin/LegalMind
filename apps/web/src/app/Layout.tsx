import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Gavel,
  LayoutDashboard,
  Library,
  Settings,
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { Lawyer } from '../types/contracts';

const navigation = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Cases', to: '/cases', icon: BriefcaseBusiness },
  { label: 'Documents', to: '/cases', icon: FileText },
  { label: 'Saved answers', to: '/cases', icon: Library },
];

export function Layout() {
  const [lawyer, setLawyer] = useState<Lawyer>();
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    void Promise.all([apiClient.getCurrentLawyer(), apiClient.health()]).then(
      ([currentLawyer, health]) => {
        setLawyer(currentLawyer);
        setApiOnline(health.ok);
      },
    );
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-navy px-4 py-6 text-white">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white">
            <Gavel size={19} strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-xl tracking-tight">LegalMind</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Counsel workspace</div>
          </div>
        </div>

        <div className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Activity size={14} className={apiOnline ? 'text-emerald-400' : 'text-amber-400'} />
              API status
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${apiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {apiOnline ? 'Local workspace connected' : 'Connecting...'}
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 px-2 pt-4 text-slate-400">
            <Settings size={17} />
            <span className="text-sm">Workspace settings</span>
          </div>
        </div>
      </aside>

      <div className="ml-64 min-h-screen">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Legal intelligence</p>
            <p className="mt-1 text-sm text-slate-500">Private workspace for counsel</p>
          </div>
          <button className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10 text-xs font-bold text-teal">
              {lawyer?.name.split(' ').map((part) => part[0]).join('') ?? '...'}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-700">{lawyer?.name ?? 'Loading lawyer'}</div>
              <div className="text-xs text-slate-400">Attorney workspace</div>
            </div>
            <ChevronDown size={15} className="text-slate-400" />
          </button>
        </header>
        <main className="px-10 py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
