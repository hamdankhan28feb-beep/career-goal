'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink, FileText, X } from 'lucide-react';

/**
 * Source drawer for citations (Evidence Atlas).
 *
 * VerificationBadge wording rule (field-level, not whole-university):
 *   A badge reflects the status of the *matched research row/field* (e.g. "computing programmes
 *   and admissions URL checked on 2026-10-11"). It is NOT a guarantee that every fact shown for
 *   that university (fees, merit, deadlines, rankings) is verified. Always pair a badge with
 *   VERIFICATION_SCOPE_NOTE (or its title tooltip) and a "Checked YYYY-MM-DD" FreshnessLabel.
 */
export const VERIFICATION_SCOPE_NOTE =
  'This badge describes the matched FuturePath research record (the fields we checked against the source on the date shown). It is not a guarantee about every detail of the institution — always confirm fees, deadlines and merit on the official website.';

export type SourceCitation = {
  /** Display marker, e.g. "S1" or "1" */
  ref?: string;
  title: string;
  publisher?: string | null;
  url?: string | null;
  /** Extra URLs (e.g. scholarship source_url lists several) */
  urls?: string[];
  /** YYYY-MM-DD when FuturePath last checked the source */
  retrievedAt?: string | null;
  /** Row status: verified / partial / unverified / active / closed / unknown */
  status?: string | null;
  excerpt?: string | null;
  kind?: string | null;
};

const STATUS_TEXT: Record<string, string> = {
  verified: 'Verified research record',
  partial: 'Partially verified research record',
  unverified: 'Unverified (HEC listing only)',
  active: 'Active — open window confirmed on source',
  closed: 'Closed — last window has ended',
  unknown: 'Unknown — no current dated window found',
  url_checked: 'Link checked',
};

export function SourceDrawer({
  open,
  citation,
  onClose,
}: {
  open: boolean;
  citation: SourceCitation | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocused.current?.focus?.();
    };
  }, [open]);

  if (!open || !citation) return null;

  const urls = Array.from(new Set([citation.url, ...(citation.urls ?? [])].filter(Boolean) as string[]));
  const statusKey = (citation.status || '').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close source details"
        tabIndex={-1}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-drawer-title"
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-background p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden />
            Source{citation.ref ? ` [${citation.ref}]` : ''}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="source-drawer-title" className="mt-3 text-lg font-semibold text-foreground">
          {citation.title}
        </h2>

        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Publisher</dt>
            <dd className="mt-0.5 text-foreground">{citation.publisher || 'Not recorded'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Checked by FuturePath</dt>
            <dd className="mt-0.5 text-foreground">{citation.retrievedAt || 'Date unknown'}</dd>
          </div>
          {statusKey ? (
            <div>
              <dt className="text-xs text-muted-foreground">Record status</dt>
              <dd className="mt-0.5 text-foreground">{STATUS_TEXT[statusKey] ?? citation.status}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs text-muted-foreground">Link{urls.length > 1 ? 's' : ''}</dt>
            <dd className="mt-1 space-y-1.5">
              {urls.length ? (
                urls.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1.5 break-all text-primary hover:underline"
                  >
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {u}
                  </a>
                ))
              ) : (
                <span className="text-muted-foreground">No URL recorded</span>
              )}
            </dd>
          </div>
          {citation.excerpt ? (
            <div>
              <dt className="text-xs text-muted-foreground">What FuturePath recorded</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-2xl border border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
                {citation.excerpt}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          {VERIFICATION_SCOPE_NOTE}
        </p>
      </aside>
    </div>
  );
}

/** Small inline chip, e.g. [S1], that opens the drawer. */
export function CitationChip({
  citation,
  onOpen,
  dimmed = false,
}: {
  citation: SourceCitation;
  onOpen: (c: SourceCitation) => void;
  dimmed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(citation)}
      title={`${citation.title}${citation.retrievedAt ? ` · checked ${citation.retrievedAt}` : ''}`}
      className={`inline-flex min-h-10 lg:min-h-0 max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        dimmed ? 'border-dashed border-border text-muted-foreground' : 'border-border bg-card text-foreground'
      }`}
    >
      {citation.ref ? <span className="font-semibold">[{citation.ref}]</span> : null}
      <span className="truncate">{citation.title}</span>
    </button>
  );
}
