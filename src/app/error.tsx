'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground text-sm leading-7">
          An unexpected error occurred. This may be a temporary issue. Try refreshing or go back to the previous page.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground/60 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          <Link href="/" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
