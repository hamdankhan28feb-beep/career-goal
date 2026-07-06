import Link from 'next/link';
import { getUniversities } from '@/lib/data';
import { getPendingReviews } from '@/lib/reviews-store';
import { AdminReviewsClient } from '@/components/admin-reviews-client';
import { Star, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

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

export default async function AdminReviewsPage() {
  const universities = await getUniversities();
  const pendingReviews = await getPendingReviews();
  const allReviews = universities.flatMap((u) =>
    u.reviews.map((r) => ({ ...r, universityName: u.shortName, universitySlug: u.slug }))
  );

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((a, r) => a + (r.rating_overall ?? 0), 0) / allReviews.length).toFixed(1)
    : '—';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Admin Dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Moderate Reviews</h1>
        <p className="mt-2 text-muted-foreground">
          {allReviews.length} published reviews · {pendingReviews.length} pending · Platform avg: ⭐ {avgRating}
        </p>
      </div>

      <AdminReviewsClient pendingReviews={pendingReviews} />

      {allReviews.length > 0 ? (
        <div className="space-y-4">
          {allReviews.map((r, i) => (
            <div key={i} className="rounded-3xl border border-border/70 bg-card/80 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Link href={`/universities/${r.universitySlug}#reviews`} className="text-sm font-semibold text-primary hover:underline">{r.universityName}</Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">{r.reviewer_type ?? 'Anonymous Student'}</div>
                </div>
                <StarRating value={r.rating_overall} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground mb-3">
                <span>Faculty: <strong>{r.rating_faculty?.toFixed(1) ?? '—'}</strong></span>
                <span>Facilities: <strong>{r.rating_facilities?.toFixed(1) ?? '—'}</strong></span>
                <span>Value: <strong>{r.rating_value_for_money?.toFixed(1) ?? '—'}</strong></span>
              </div>
              {r.positive_experiences && (
                <div className="mb-2 flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-xs">{r.positive_experiences}</p>
                </div>
              )}
              {r.common_complaints && (
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-xs">{r.common_complaints}</p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition">✓ Approve</button>
                <button className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/20 transition">✕ Remove</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border/70 bg-muted/30 p-16 text-center">
          <Star className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-6 text-xl font-semibold">No reviews yet</h3>
          <p className="mt-3 text-muted-foreground">Reviews submitted by students will appear here for moderation.</p>
        </div>
      )}
    </div>
  );
}
