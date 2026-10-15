'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Filter,
  HelpCircle,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';

import { FreshnessLabel } from '@/components/freshness-label';
import { SourceDrawer, type SourceCitation } from '@/components/source-drawer';

/** Shape returned by /api/scholarships (DB rows or research_csv / research_json fallback). */
export type ApiScholarship = {
  scholarship_id: number;
  scholarship_name: string;
  scholarship_type: string;
  eligibility: string;
  coverage_percentage: number | null;
  coverage_type: string;
  annual_value_pkr: number | null;
  renewable: boolean;
  renewable_conditions: string;
  seats_available: number | null;
  external_body: string;
  application_url: string;
  universityName: string;
  universityShortName: string;
  universitySlug: string;
  universityCity: string;
  status?: string;
  source_url?: string;
  last_verified_at?: string;
  notes?: string;
  // Present only with the optional enriched API (optional/src/app/api/scholarships/route.ts)
  research_id?: string;
  provider_type?: string;
  deadline?: string;
  eligible_levels?: string;
  documents_required?: string;
};

type ApiResponse = {
  scholarships?: ApiScholarship[];
  nextCursor?: string | null;
  total?: number;
  source?: string;
  disclaimer?: string;
  error?: string;
};

type Status = 'active' | 'closed' | 'unknown';

const PROVIDER_TYPE_LABEL: Record<string, string> = {
  federal: 'Federal (HEC / Govt)',
  provincial: 'Provincial',
  university: 'University',
  private_foundation: 'Private foundation',
  unknown: 'Unknown',
};

function normStatus(s?: string): Status {
  const v = (s || '').toLowerCase();
  // Only an explicit "active" from the data counts as active — never inferred.
  return v === 'active' ? 'active' : v === 'closed' ? 'closed' : 'unknown';
}

function providerTypeOf(s: ApiScholarship, source: string): string {
  if (s.provider_type) return s.provider_type;
  // research_csv fallback puts raw provider_type into universityShortName
  if (source.startsWith('research') && s.universityShortName) return s.universityShortName;
  return 'unknown';
}

function splitUrls(v?: string): string[] {
  return (v || '')
    .split(/\s*;\s*|\s+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u));
}

function StatusBadge({ status }: { status: Status }) {
  const meta = {
    active: {
      label: 'Active',
      Icon: CheckCircle2,
      cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      title: 'An open application window was confirmed on the official source on the checked date.',
    },
    closed: {
      label: 'Closed',
      Icon: XCircle,
      cls: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
      title: 'The most recent application window on the official source has ended.',
    },
    unknown: {
      label: 'Unknown',
      Icon: HelpCircle,
      cls: 'border-dashed border-border bg-muted/30 text-muted-foreground',
      title: 'No current, dated application window was found on the official source. Check the source directly.',
    },
  }[status];
  const { Icon } = meta;
  return (
    <span
      title={meta.title}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value || !value.trim()) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-foreground">{value}</dd>
    </div>
  );
}

async function fetchAll(): Promise<{ rows: ApiScholarship[]; source: string; disclaimer?: string }> {
  const rows: ApiScholarship[] = [];
  let cursor: string | null = null;
  let source = 'unknown';
  let disclaimer: string | undefined;
  for (let page = 0; page < 25; page++) {
    const qs = new URLSearchParams({ limit: '50' });
    if (cursor) qs.set('cursor', cursor);
    const res = await fetch(`/api/scholarships?${qs.toString()}`, { cache: 'no-store' });
    const data = (await res.json()) as ApiResponse;
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    rows.push(...(data.scholarships ?? []));
    source = data.source ?? source;
    disclaimer = data.disclaimer ?? disclaimer;
    cursor = data.nextCursor ?? null;
    if (!cursor) break;
  }
  return { rows, source, disclaimer };
}

export function ScholarshipFinder() {
  const [rows, setRows] = useState<ApiScholarship[]>([]);
  const [source, setSource] = useState('unknown');
  const [disclaimer, setDisclaimer] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [drawer, setDrawer] = useState<SourceCitation | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((r) => {
        if (cancelled) return;
        setRows(r.rows);
        setSource(r.source);
        setDisclaimer(r.disclaimer);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load scholarships.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c = { active: 0, closed: 0, unknown: 0 };
    rows.forEach((r) => {
      c[normStatus(r.status)]++;
    });
    return c;
  }, [rows]);

  const providerTypes = useMemo(
    () => Array.from(new Set(rows.map((r) => providerTypeOf(r, source)))).sort(),
    [rows, source]
  );
  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.scholarship_type).filter(Boolean))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return rows
      .filter((r) => statusFilter === 'all' || normStatus(r.status) === statusFilter)
      .filter((r) => providerFilter === 'all' || providerTypeOf(r, source) === providerFilter)
      .filter((r) => typeFilter === 'all' || r.scholarship_type === typeFilter)
      .filter((r) => {
        if (!terms.length) return true;
        const hay = [
          r.scholarship_name,
          r.external_body,
          r.universityName,
          r.universityCity,
          r.eligibility,
          r.coverage_type,
          r.notes,
          r.eligible_levels,
        ]
          .join(' ')
          .toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .sort((a, b) => {
        const order: Record<Status, number> = { active: 0, unknown: 1, closed: 2 };
        return order[normStatus(a.status)] - order[normStatus(b.status)] || a.scholarship_name.localeCompare(b.scholarship_name);
      });
  }, [rows, q, statusFilter, providerFilter, typeFilter, source]);

  const isResearch = source.startsWith('research');

  function openSources(r: ApiScholarship) {
    const urls = splitUrls(r.source_url);
    setDrawer({
      title: r.scholarship_name,
      publisher: r.external_body || r.universityName,
      url: urls[0] ?? r.application_url ?? null,
      urls: [...urls, ...splitUrls(r.application_url)],
      retrievedAt: r.last_verified_at || null,
      status: normStatus(r.status),
      excerpt: r.notes || null,
      kind: 'scholarship',
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
          <Award className="h-3.5 w-3.5" aria-hidden />
          Scholarship Finder
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Find scholarships you can actually check</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Every entry links to its official source. Statuses come from the source page on the date shown — we never mark a
          scholarship &ldquo;Active&rdquo; unless an open, dated window was confirmed.
        </p>
      </header>

      {!loading && !error && counts.active === 0 && rows.length > 0 ? (
        <div
          role="status"
          className="mb-6 flex gap-3 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-foreground"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <div>
            <p className="font-medium">No scholarship is currently verified as open.</p>
            <p className="mt-1 text-muted-foreground">
              Of {rows.length} programmes we track, {counts.closed} have a closed last window and {counts.unknown} have no
              current dated window on their official page (&ldquo;Unknown&rdquo;). Programmes often reopen each year — use
              the source links to check the latest call, and contact the university financial aid office directly.
            </p>
          </div>
        </div>
      ) : null}

      <section aria-label="Filters" className="mb-6 rounded-3xl border border-border/70 bg-card/80 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <label className="relative block">
            <span className="sr-only">Search scholarships</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, provider, university, eligibility…"
              className="input-field w-full pl-9"
            />
          </label>
          <label className="block">
            <span className="sr-only">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
              className="input-field w-full"
            >
              <option value="all">All statuses</option>
              <option value="active">Active ({counts.active})</option>
              <option value="unknown">Unknown ({counts.unknown})</option>
              <option value="closed">Closed ({counts.closed})</option>
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Provider type</span>
            <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className="input-field w-full">
              <option value="all">All providers</option>
              {providerTypes.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_TYPE_LABEL[p] ?? p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Scholarship type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-full">
              <option value="all">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            {loading ? 'Loading scholarships…' : `Showing ${filtered.length} of ${rows.length}`}
          </span>
          {!loading && source !== 'unknown' && (
            <span>
              Data source: {isResearch ? 'FuturePath research dataset (official pages)' : source === 'database' ? 'FuturePath database' : source}
            </span>
          )}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2" role="status" aria-busy="true" data-testid="scholarships-skeleton">
          <span className="sr-only">Loading scholarships…</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-3xl border border-border/70 bg-card/60 p-6" aria-hidden>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />
                <div className="h-4 w-2/3 rounded-full bg-muted" />
              </div>
              <div className="mt-3 h-3 w-1/3 rounded-full bg-muted" />
              <div className="mt-6 h-3 w-full rounded-full bg-muted/80" />
              <div className="mt-2 h-3 w-5/6 rounded-full bg-muted/80" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-muted/80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm" role="alert">
          Could not load scholarships: {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <CircleDashed className="h-6 w-6" aria-hidden />
          No scholarships match these filters.
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {filtered.map((r) => {
            const status = normStatus(r.status);
            const pType = providerTypeOf(r, source);
            const sourceUrls = splitUrls(r.source_url);
            return (
              <li key={`${r.research_id ?? r.scholarship_id}`} className="flex flex-col rounded-3xl border border-border/70 bg-card/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold leading-snug text-foreground">{r.scholarship_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.external_body || r.universityName}
                      {pType !== 'unknown' ? ` · ${PROVIDER_TYPE_LABEL[pType] ?? pType}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <dl className="mt-4 space-y-3">
                  <Field label="Eligibility" value={r.eligibility} />
                  <Field label="Levels" value={r.eligible_levels} />
                  <Field
                    label="Coverage (as stated by provider)"
                    value={
                      r.coverage_type ||
                      (r.coverage_percentage != null ? `${r.coverage_percentage}%` : null)
                    }
                  />
                  <Field label="Deadline (as stated by provider)" value={r.deadline} />
                  <Field label="Where it applies" value={isResearch ? r.universityName : `${r.universityName}, ${r.universityCity}`} />
                  <Field label="Renewal" value={r.renewable_conditions} />
                  <Field label="Documents" value={r.documents_required} />
                  {r.notes ? (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                        Research notes
                      </summary>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.notes}</p>
                    </details>
                  ) : null}
                </dl>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  {r.application_url ? (
                    <a
                      href={r.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center gap-1.5 text-sm"
                    >
                      Official application page <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : null}
                  {sourceUrls.length || r.notes ? (
                    <button
                      type="button"
                      onClick={() => openSources(r)}
                      className="inline-flex min-h-10 lg:min-h-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      Sources{sourceUrls.length ? ` (${sourceUrls.length})` : ''}
                    </button>
                  ) : null}
                  <span className="ml-auto">
                    <FreshnessLabel checkedAt={r.last_verified_at || null} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {disclaimer ? <p className="mt-8 text-xs text-muted-foreground">{disclaimer}</p> : null}

      <SourceDrawer open={!!drawer} citation={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}
