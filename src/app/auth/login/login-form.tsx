'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react';

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: 'Google sign-in is unavailable.',
  google_denied: 'Google sign-in was cancelled.',
  invalid_oauth: 'This sign-in link has expired. Please try again.',
  oauth_failed: 'Google sign-in failed. Please try again.',
  email_not_verified: 'Your Google account email is not verified.',
};

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Surface errors returned by the Google OAuth callback (e.g. cancelled or
  // expired sign-in) and clean them out of the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      setError(GOOGLE_ERROR_MESSAGES[err] ?? 'Google sign-in failed. Please try again.');
      params.delete('error');
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string; redirect?: string };
      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials.');
        return;
      }
      window.location.href = data.redirect ?? '/';
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function startGoogleSignIn() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    const target = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(target)}`;
  }

  return (
    <div className="flex min-h-[calc(100svh-80px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-glow-primary">
            <GraduationCap className="h-7 w-7" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your FuturePath account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={startGoogleSignIn}
              className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted/50"
            >
              <GoogleLogo className="h-5 w-5" />
              Continue with Google
            </button>
            <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border/70" />
              or continue with email
              <div className="h-px flex-1 bg-border/70" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
              className="input-field" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input-field input-with-action" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'} className="btn-icon absolute right-1 top-1/2 -translate-y-1/2">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'} {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
