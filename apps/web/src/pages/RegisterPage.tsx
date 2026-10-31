import { useState, type FormEvent } from 'react';
import { ArrowRight, Gavel, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { registerLawyer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    void registerLawyer(form.name, form.email, form.password)
      .then(() => navigate('/', { replace: true }))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to create account.'))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <section className="w-full max-w-md">
        <div className="mb-9 flex items-center justify-center gap-3 text-navy"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-white"><Gavel size={20} /></div><span className="font-display text-2xl">LegalMind</span></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-teal">Get started</p>
          <h1 className="mt-2 font-display text-4xl text-navy">Create your workspace</h1>
          <p className="mt-3 text-sm text-slate-500">Set up a private workspace for your legal matters.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Name<div className="relative mt-2"><UserRound size={17} className="absolute left-3 top-3 text-slate-400" /><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" placeholder="Your full name" /></div></label>
            <label className="block text-sm font-medium text-slate-700">Email<div className="relative mt-2"><Mail size={17} className="absolute left-3 top-3 text-slate-400" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" placeholder="you@lawfirm.com" /></div></label>
            <label className="block text-sm font-medium text-slate-700">Password<div className="relative mt-2"><LockKeyhole size={17} className="absolute left-3 top-3 text-slate-400" /><input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10" placeholder="Create a password" /></div></label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-3 text-sm font-semibold text-white transition hover:bg-teal/90 disabled:opacity-50">Create account <ArrowRight size={16} /></button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-teal hover:underline">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
