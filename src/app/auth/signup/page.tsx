'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student', city: 'Karachi' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill all required fields.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          city: form.city,
        }),
      });
      const data = await res.json() as { error?: string; redirect?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not create account.');
        return;
      }
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      setSuccess(true);
    } catch {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Account Created!</h1>
          <p className="mt-3 text-muted-foreground">Welcome to FuturePath, {form.name}! Start exploring universities and career paths.</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/universities" className="btn-primary w-full justify-center">Explore Universities <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/quiz" className="btn-secondary w-full justify-center">Take Career Quiz</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-glow-primary">
            <GraduationCap className="h-7 w-7" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join thousands of students planning their future</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Full Name *</label>
              <input type="text" value={form.name} onChange={f('name')} placeholder="Ali Khan" className="input-field" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">City</label>
              <select value={form.city} onChange={f('city')} className="input-field">
                {['Karachi', 'Islamabad', 'Lahore', 'Peshawar', 'Quetta', 'Other'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Email *</label>
            <input type="email" value={form.email} onChange={f('email')} placeholder="ali@example.com" className="input-field" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">I am a…</label>
            <div className="flex gap-2">
              {[{ v: 'student', l: '🎓 Student' }, { v: 'parent', l: '👨‍👩‍👦 Parent' }, { v: 'counselor', l: '🗣️ Counselor' }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setForm((p) => ({ ...p, role: v }))}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition ${form.role === v ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 text-muted-foreground hover:border-primary/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password *</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={f('password')} placeholder="Min 8 characters" className="input-field pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Confirm Password *</label>
            <input type="password" value={form.confirm} onChange={f('confirm')} placeholder="Repeat password" className="input-field" />
          </div>
          {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create Account'} {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
