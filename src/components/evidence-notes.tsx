import Link from 'next/link';

import { conflictsFor, ratingsForSlug } from '@/lib/evidence';

export function EvidenceNotes({ slug }: { slug: string }) {
  const ratings = ratingsForSlug(slug);
  const conflicts = conflictsFor(slug);
  if (!ratings.length && !conflicts.length) return null;

  return (
    <div className="mt-8 space-y-6">
      {ratings.length > 0 && (
        <section className="rounded-3xl border border-border/70 bg-card/80 p-5" aria-labelledby="oric-heading">
          <h2 id="oric-heading" className="text-lg font-semibold">Ratings and categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            HEC ORIC W/X/Y is a research-office evaluation, not an overall university ranking.
          </p>
          <ul className="mt-4 space-y-3">
            {ratings.map((r) => (
              <li key={`${r.label}-${r.year}`} className="rounded-2xl border border-border/60 p-4 text-sm">
                <div className="font-medium text-foreground">{r.label}: {r.value}</div>
                <p className="mt-1 text-muted-foreground">
                  {r.kind === 'category' ? 'Category' : 'Ranking'} · {r.authority} · {r.year}
                </p>
                <a href={r.source_url} className="mt-2 inline-flex text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  {r.source_title}
                </a>
                {r.notes && <p className="mt-2 text-xs text-muted-foreground">{r.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {conflicts.map((c) => (
        <section key={c.field_key} className="rounded-3xl border border-warning/30 bg-card/80 p-5" aria-labelledby={`conflict-${c.field_key}`}>
          <h2 id={`conflict-${c.field_key}`} className="text-lg font-semibold">Conflicting sources: {c.field_key}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            More than one source describes this field. The primary list is shown separately from the others. No single figure is invented to reconcile them.
          </p>
          <div className="mt-4 rounded-2xl border border-border/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">Primary · {c.primary.status}</div>
            <p className="mt-1 text-sm font-medium">{c.primary.label}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {c.primary.values.map((v) => <li key={v}>{v}</li>)}
            </ul>
            {c.primary.source_url && (
              <a href={c.primary.source_url} className="mt-2 inline-flex text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {c.primary.source_title || c.primary.source_url}
              </a>
            )}
            {c.primary.note && <p className="mt-2 text-xs text-muted-foreground">{c.primary.note}</p>}
          </div>
          <ul className="mt-3 space-y-3">
            {c.alternatives.map((alt) => (
              <li key={alt.label} className="rounded-2xl border border-dashed border-border/70 p-4 text-sm">
                <div className="font-medium">{alt.label}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {alt.values.map((v) => <li key={v}>{v}</li>)}
                </ul>
                {alt.source_url && (
                  <a href={alt.source_url} className="mt-2 inline-flex text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {alt.source_title || alt.source_url}
                  </a>
                )}
                {alt.note && <p className="mt-2 text-xs text-muted-foreground">{alt.note}</p>}
              </li>
            ))}
          </ul>
          <Link href={`/report?entity=${encodeURIComponent(slug)}&field=${encodeURIComponent(c.field_key)}`} className="mt-4 inline-flex text-sm text-primary hover:underline">
            Report incorrect information
          </Link>
        </section>
      ))}
    </div>
  );
}
