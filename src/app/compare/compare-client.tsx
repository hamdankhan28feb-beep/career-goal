'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, BarChart2, ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { initialsSize, logoInitials, profileCompleteness } from '@/lib/display-utils';
import type { University } from '@/lib/types';
import { findProfileField, profileSearchText } from '@/lib/profile-utils';

const COMPARE_LIMIT = 3;

const COMPARISON_ROWS = [
  { key: 'city', label: 'City', format: (u: University) => u.city },
  { key: 'type', label: 'Type', format: (u: University) => u.universityType },
  { key: 'established', label: 'Established', format: (u: University) => u.yearEstablished ? String(u.yearEstablished) : '—' },
  { key: 'hec', label: 'HEC Status', format: (u: University) => u.hecStatus ?? '—' },
  { key: 'campuses', label: 'Campuses', format: (u: University) => String(u.campuses.length || 1) },
  { key: 'programs', label: 'Programs', format: (u: University) => String(u.programsCount || '—') },
  { key: 'scholarships', label: 'Scholarships', format: (u: University) => String(u.scholarships.length || 0) },
  { key: 'accreditations', label: 'Accreditations', format: (u: University) => String(u.accreditations.length || 0) },
  { key: 'semester_fee', label: 'Semester Fee', format: (u: University) => u.fees?.semester_fee ? `PKR ${u.fees.semester_fee.toLocaleString()}` : '—' },
  { key: 'admission_fee', label: 'Admission Fee', format: (u: University) => u.fees?.admission_fee ? `PKR ${u.fees.admission_fee.toLocaleString()}` : '—' },
  { key: 'hostel', label: 'Hostel', format: (u: University) => u.hostel?.hostel_availability === true ? '✅ Available' : u.hostel?.hostel_availability === false ? '❌ N/A' : '—' },
  { key: 'transport', label: 'Transport', format: (u: University) => u.transport?.transport_available === true ? '✅ Available' : u.transport?.transport_available === false ? '❌ N/A' : '—' },
  { key: 'phd_faculty', label: 'PhD Faculty', format: (u: University) => u.facultyAcademics?.phd_faculty_count ? String(u.facultyAcademics.phd_faculty_count) : '—' },
  { key: 'ratio', label: 'Student:Faculty', format: (u: University) => u.facultyAcademics?.student_faculty_ratio ?? '—' },
  { key: 'placement', label: 'Placement Rate', format: (u: University) => u.placements?.placement_rate_pct ? `${u.placements.placement_rate_pct}%` : '—' },
  { key: 'profile', label: 'Detailed Profile', format: (u: University) => u.profile ? `${u.profile.profile_status === 'complete' ? 'Complete' : 'Partial'} (${u.profile.field_counts.sourced} sourced, checked ${u.profile.last_checked})` : '-' },
  { key: 'tuition', label: 'Tuition (official, sourced)', format: (u: University) => findProfileField(u.profile?.sections.fees ?? [], /^Tuition/)?.value ?? '-' },
  { key: 'computing', label: 'CS / AI / DS / SE (UG)', format: (u: University) => (u.profile?.sections.programs ?? []).filter((f) => f.value && /computer science|artificial intelligence|data science|software engineering/i.test(f.label) && !/not offered|not listed/i.test(f.value)).map((f) => f.label.replace(/^(BS|BE\/BS) /, '')).join(', ') || '-' },
  { key: 'test', label: 'Admission Test', format: (u: University) => findProfileField(u.profile?.sections.admissions ?? [], /admission test/i)?.value ?? '-' },
  { key: 'data', label: 'Data Completeness', format: (u: University) => `${profileCompleteness(u.profile) ?? u.dataCompleteness}%` },
];

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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary mb-4">
          <BarChart2 className="h-4 w-4" /> Side-by-side comparison
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Compare Universities</h1>
        <p className="mt-3 text-muted-foreground">Search and pick up to 3 universities, then compare them side by side.</p>
      </div>

      {!comparing ? (
        <>
          <div className="max-w-2xl">
            <label htmlFor="compare-search" className="mb-2 block text-sm font-medium">Find a university</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="compare-search"
                type="text"
                placeholder="Search universities..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="input-field w-full pl-11"
                autoComplete="off"
                aria-controls="compare-results"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Name, short name, city or a programme (e.g. &ldquo;Data Science&rdquo;).</span>
              <button type="button" onClick={() => setBrowseAll((v) => !v)} className="inline-flex min-h-10 items-center font-medium text-primary hover:underline lg:min-h-0">
                {browseAll ? 'Hide full list' : `Browse all ${universities.length}`}
              </button>
            </div>
          </div>

          {showList && (
            <div id="compare-results" className="mt-5">
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
            <div className="sticky bottom-4 z-40 mt-8" data-testid="compare-bar">
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
          <div className="max-h-[75vh] overflow-auto rounded-3xl border border-border/70 shadow-sm" data-testid="compare-table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="sticky left-0 top-0 z-30 bg-muted px-3 sm:px-5 py-4 text-left text-xs font-semibold text-muted-foreground w-28 sm:w-44">Category</th>
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
                    <td className="sticky left-0 z-10 bg-muted lg:bg-muted/60 backdrop-blur px-3 sm:px-5 py-3.5 text-xs font-semibold text-muted-foreground">{row.label}</td>
                    {selected.map((u) => (
                      <td key={u.slug} className="px-3 sm:px-5 py-3.5 text-sm text-foreground">{row.format(u)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 grid gap-5" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
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
