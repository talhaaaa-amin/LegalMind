import { useState, type FormEvent } from 'react';
import { ArrowRight, Gavel, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { quickDemoLogin, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const signIn = async (action: () => Promise<unknown>) => {
    setError('');
    setIsSubmitting(true);
    try {
      await action();
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void signIn(() => loginWithEmail(email, password));
  };

  return (
    <main className="flex min-h-screen bg-paper">
      <section className="hidden w-1/2 flex-col justify-between bg-navy p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal"><Gavel size={20} /></div>
          <span className="font-display text-2xl">LegalMind</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-teal-300">Counsel workspace</p>
          <h1 className="mt-4 max-w-md font-display text-5xl leading-tight">Your matters. Your evidence. Your edge.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">A private legal document intelligence workspace built for lawyers and the way they work.</p>
        </div>
        <p className="text-xs text-slate-500">Confidential workspace · Lawyer access only</p>
      </section>
      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-9 lg:hidden">
            <div className="flex items-center gap-3 text-navy"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-white"><Gavel size={20} /></div><span className="font-display text-2xl">LegalMind</span></div>
          </div>
          <p className="text-sm font-semibold text-teal">Welcome back</p>
          <h2 className="mt-2 font-display text-4xl text-navy">Sign in to your workspace</h2>
          <p className="mt-3 text-sm text-slate-500">Choose a demo lawyer or use any dummy credentials.</p>

          <div className="mt-7 space-y-3">
            <button disabled={isSubmitting} onClick={() => void signIn(() => quickDemoLogin('lawyer-1'))} className="w-full rounded-lg border border-teal/30 bg-teal/5 px-4 py-3 text-left text-sm font-semibold text-teal transition hover:bg-teal/10 disabled:opacity-50">1-Click Login: Amelia Hart (Lawyer A)</button>
            <button disabled={isSubmitting} onClick={() => void signIn(() => quickDemoLogin('lawyer-2'))} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-teal/40 hover:text-teal disabled:opacity-50">1-Click Login: Marcus Vance (Lawyer B)</button>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs text-slate-400"><div className="h-px flex-1 bg-slate-200" /> or sign in with email <div className="h-px flex-1 bg-slate-200" /></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Email<div className="relative mt-2"><Mail size={17} className="absolute left-3 top-3 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/10" placeholder="you@lawfirm.com" /></div></label>
            <label className="block text-sm font-medium text-slate-700">Password<div className="relative mt-2"><LockKeyhole size={17} className="absolute left-3 top-3 text-slate-400" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/10" placeholder="Enter any dummy password" /></div></label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-3 text-sm font-semibold text-white transition hover:bg-teal/90 disabled:opacity-50">Sign in <ArrowRight size={16} /></button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">New to LegalMind? <Link to="/register" className="font-semibold text-teal hover:underline">Create a lawyer account</Link></p>
        </div>
      </section>
    </main>
  );
}
