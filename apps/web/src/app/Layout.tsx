import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BriefcaseBusiness,
  ChevronDown,
  LogOut,
  FileText,
  Gavel,
  LayoutDashboard,
  Library,
  Settings,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Cases', to: '/cases', icon: BriefcaseBusiness },
  { label: 'Documents', to: '/cases', icon: FileText },
  { label: 'Saved answers', to: '/cases', icon: Library },
];

export function Layout() {
  const { currentLawyer, quickDemoLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    void apiClient.health().then((health) => setApiOnline(health.ok));
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
          <div className="relative">
          <button onClick={() => setIsProfileOpen((open) => !open)} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10 text-xs font-bold text-teal">
              {currentLawyer?.name.split(' ').map((part) => part[0]).join('') ?? '...'}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-700">{currentLawyer?.name ?? 'Loading lawyer'}</div>
              <div className="text-xs text-slate-400">{currentLawyer?.email ?? 'Attorney workspace'}</div>
            </div>
            <ChevronDown size={15} className="text-slate-400" />
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="border-b border-slate-100 px-3 pb-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Switch lawyer</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{currentLawyer?.email}</p>
              </div>
              {[
                ['lawyer-1', 'Amelia Hart'],
                ['lawyer-2', 'Marcus Vance'],
              ].map(([lawyerId, name]) => (
                <button
                  key={lawyerId}
                  onClick={() => {
                    void quickDemoLogin(lawyerId as 'lawyer-1' | 'lawyer-2').then(() => {
                      setIsProfileOpen(false);
                      navigate(0);
                    });
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  {name}
                  {currentLawyer?.id === lawyerId && <span className="text-xs font-semibold text-teal">Active</span>}
                </button>
              ))}
              <button onClick={() => void logout().then(() => navigate('/login', { replace: true }))} className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
          </div>
        </header>
        <main className="px-10 py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
