'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, XCircle } from 'lucide-react';

import type { PendingReview } from '@/lib/reviews-store';

function StarRating({ value }: { value: number | null | undefined }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3 w-3 ${i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}

export function AdminReviewsClient({ pendingReviews }: { pendingReviews: PendingReview[] }) {
  const [reviews, setReviews] = useState(pendingReviews);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: 'approved' | 'removed') {
    setLoadingId(id);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (reviews.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-4 text-lg font-semibold">Pending Submissions ({reviews.length})</h2>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <Link href={`/universities/${r.universitySlug}#reviews`} className="text-sm font-semibold text-primary hover:underline">
                  {r.universityName}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">{r.reviewerType} · Pending moderation</div>
              </div>
              <StarRating value={r.ratingOverall} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground mb-3">
              <span>Faculty: <strong>{r.ratingFaculty.toFixed(1)}</strong></span>
              <span>Facilities: <strong>{r.ratingFacilities.toFixed(1)}</strong></span>
              <span>Value: <strong>{r.ratingValueForMoney.toFixed(1)}</strong></span>
            </div>
            {r.positiveExperiences && (
              <div className="mb-2 flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground text-xs">{r.positiveExperiences}</p>
              </div>
            )}
            {r.commonComplaints && (
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground text-xs">{r.commonComplaints}</p>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={loadingId === r.id}
                onClick={() => updateStatus(r.id, 'approved')}
                className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
              >
                ✓ Approve
              </button>
              <button
                type="button"
                disabled={loadingId === r.id}
                onClick={() => updateStatus(r.id, 'removed')}
                className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
