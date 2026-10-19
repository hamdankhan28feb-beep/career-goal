'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/search-input';
import Link from 'next/link';
import { X, BarChart2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { initialsSize, logoInitials } from '@/lib/display-utils';
import type { University } from '@/lib/types';
import { profileSearchText } from '@/lib/profile-utils';
import { COMPARISON_ROWS } from '@/lib/compare-rows';

const COMPARE_LIMIT = 3;

export function CompareClient({ universities }: { universities: University[] }) {
  const [selected, setSelected] = useState<University[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [comparing, setComparing] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);

  const q = searchQ.trim().toLowerCase();
  const filtered = universities.filter((u) =>
    q === '' || u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q) || u.city.toLowerCase().includes(q) || profileSearchText(u.profile).includes(q),
  );
  const showList = q !== '' || browseAll;
  const visible = q !== '' && !browseAll ? filtered.slice(0, 8) : filtered;

  function toggleSelect(u: University) {
    if (selected.find((s) => s.slug === u.slug)) {
      setSelected((prev) => prev.filter((s) => s.slug !== u.slug));
    } else if (selected.length < COMPARE_LIMIT) {
      setSelected((prev) => [...prev, u]);
    }
  }

  const isSelected = (u: University) => selected.some((s) => s.slug === u.slug);

  return (
    <div className="container-page py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary mb-4">
          <BarChart2 className="h-4 w-4" /> Side-by-side comparison
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Compare Universities</h1>
        <p className="mt-3 text-muted-foreground">Search and pick up to 3 universities, then compare them on {COMPARISON_ROWS.length} rows. A missing figure is shown as Not available.</p>
      </div>

      {!comparing ? (
        <>
          <div className="max-w-2xl">
            <label htmlFor="compare-search" className="mb-2 block text-sm font-medium">Find a university</label>
            <SearchInput
              id="compare-search"
              type="text"
              placeholder="Search universities..."
              value={searchQ}
              onValueChange={setSearchQ}
              autoComplete="off"
              aria-controls="compare-results"
              clearable
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Name, short name, city or a programme (e.g. &ldquo;Data Science&rdquo;).</span>
              <button type="button" onClick={() => setBrowseAll((v) => !v)} className="inline-flex min-h-10 items-center font-medium text-primary hover:underline lg:min-h-0">
                {browseAll ? 'Hide full list' : `Browse all ${universities.length}`}
              </button>
            </div>
          </div>

          {showList && (
            <div id="compare-results" className={`mt-5 ${selected.length > 0 ? 'pb-4' : ''}`}>
              {q !== '' && (
                <div className="mb-2 text-xs text-muted-foreground">
                  {filtered.length === 0 ? 'No matches.' : `${filtered.length} match${filtered.length === 1 ? '' : 'es'}${!browseAll && filtered.length > visible.length ? `, showing first ${visible.length}` : ''}`}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((u) => {
                  const sel = isSelected(u);
                  const disabled = !sel && selected.length >= COMPARE_LIMIT;
                  const ini = logoInitials(u.shortName, u.name, u.city);
                  return (
                    <button key={u.slug} onClick={() => !disabled && toggleSelect(u)} disabled={disabled} aria-pressed={sel}
                      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${sel ? 'border-primary bg-primary/10' : disabled ? 'border-border/40 opacity-40 cursor-not-allowed' : 'border-border/70 bg-card/80 hover:border-primary/30'}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${initialsSize(ini)} ${sel ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        {sel ? <CheckCircle2 className="h-5 w-5" /> : ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {u.city} · {u.universityType}{u.profile ? ' · detailed profile' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!showList && selected.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
              Start typing to find universities. Selected universities appear in the compare bar.
            </div>
          )}

          {/* Sticky compare bar */}
          {selected.length > 0 && (
            <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mt-8 mb-4" data-testid="compare-bar">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-background/95 p-3 shadow-glow backdrop-blur">
                <span className="px-1 text-sm font-semibold">Compare ({selected.length}/{COMPARE_LIMIT})</span>
                {selected.map((u) => (
                  <span key={u.slug} className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pl-3 text-sm text-primary">
                    <span>{u.shortName}</span>
                    <button onClick={() => toggleSelect(u)} aria-label={`Remove ${u.shortName}`} className="flex h-10 w-10 items-center justify-center rounded-full transition hover:text-red-500 lg:h-8 lg:w-8">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <div className="ml-auto">
                  {selected.length >= 2 ? (
                    <button onClick={() => setComparing(true)} className="btn-primary py-2.5 text-sm">
                      Compare Now <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pick at least one more</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Side-by-Side Comparison</h2>
            <button onClick={() => setComparing(false)} className="btn-ghost text-sm">← Back</button>
          </div>
          <div className="table-wrap max-h-[75svh] overflow-y-auto shadow-sm" data-testid="compare-table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="table-sticky-col top-0 z-30 px-3 sm:px-5 py-4 text-left text-xs font-semibold text-muted-foreground w-28 sm:w-44">Category</th>
                  {selected.map((u) => (
                    <th key={u.slug} className="sticky top-0 z-20 bg-card px-3 sm:px-5 py-4 text-left min-w-[150px] sm:min-w-[180px]">
                      <div className="font-semibold text-foreground">{u.shortName}</div>
                      <div className="text-xs text-muted-foreground font-normal">{u.city}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.key} className={`${i % 2 === 0 ? 'bg-card/40' : ''} hover:bg-muted/20 transition`}>
                    <td className="table-sticky-col px-3 sm:px-5 py-3.5 text-xs font-semibold text-muted-foreground">{row.label}</td>
                    {selected.map((u) => (
                      <td key={u.slug} className="px-3 sm:px-5 py-3.5 text-sm text-foreground">{row.format(u)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`mt-8 grid gap-5 sm:grid-cols-2 ${selected.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
            {selected.map((u) => (
              <div key={u.slug} className="rounded-3xl border border-border/70 bg-card/80 p-5">
                <h3 className="mb-3 font-semibold text-sm">{u.shortName} — Key Strengths</h3>
                <ul className="space-y-2">
                  {u.overview.majorStrengths.slice(0, 4).map((s) => (
                    <li key={s} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                  {u.overview.majorStrengths.length === 0 && <li className="text-xs italic text-muted-foreground">No data yet</li>}
                </ul>
                <Link href={`/universities/${u.slug}`} className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Full profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/compare/fields" className="btn-secondary">Compare Fields Instead</Link>
            <Link href="/predictor" className="btn-primary">Try Admission Predictor <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </>
      )}
    </div>
  );
}
