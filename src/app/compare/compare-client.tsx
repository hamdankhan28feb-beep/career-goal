'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, X, BarChart2, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { University } from '@/lib/types';

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
  { key: 'data', label: 'Data Completeness', format: (u: University) => `${u.dataCompleteness}%` },
];

export function CompareClient({ universities }: { universities: University[] }) {
  const [selected, setSelected] = useState<University[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [comparing, setComparing] = useState(false);

  const filtered = universities.filter((u) => {
    const q = searchQ.toLowerCase();
    return q === '' || u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
  });

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
        <p className="mt-3 text-muted-foreground">Select up to 3 universities to compare across 16 dimensions.</p>
      </div>

      {!comparing ? (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Selected ({selected.length}/{COMPARE_LIMIT}):</span>
            {selected.map((u) => (
              <div key={u.slug} className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary">
                <span>{u.shortName}</span>
                <button onClick={() => toggleSelect(u)} className="hover:text-red-500 transition"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {selected.length >= 2 && (
              <button onClick={() => setComparing(true)} className="btn-primary py-2 text-sm">
                Compare Now <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <input type="text" placeholder="Search universities..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="input-field mb-6 max-w-md" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((u) => {
              const sel = isSelected(u);
              const disabled = !sel && selected.length >= COMPARE_LIMIT;
              return (
                <button key={u.slug} onClick={() => !disabled && toggleSelect(u)} disabled={disabled}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${sel ? 'border-primary bg-primary/10' : disabled ? 'border-border/40 opacity-40 cursor-not-allowed' : 'border-border/70 bg-card/80 hover:border-primary/30'}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${sel ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    {sel ? <CheckCircle2 className="h-5 w-5" /> : u.shortName.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.city} · {u.universityType}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Side-by-Side Comparison</h2>
            <button onClick={() => setComparing(false)} className="btn-ghost text-sm">← Back</button>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-border/70 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="sticky left-0 bg-muted/80 backdrop-blur px-5 py-4 text-left text-xs font-semibold text-muted-foreground w-44">Category</th>
                  {selected.map((u) => (
                    <th key={u.slug} className="px-5 py-4 text-left min-w-[180px]">
                      <div className="font-semibold text-foreground">{u.shortName}</div>
                      <div className="text-xs text-muted-foreground font-normal">{u.city}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.key} className={`${i % 2 === 0 ? 'bg-card/40' : ''} hover:bg-muted/20 transition`}>
                    <td className="sticky left-0 bg-muted/60 backdrop-blur px-5 py-3.5 text-xs font-semibold text-muted-foreground">{row.label}</td>
                    {selected.map((u) => (
                      <td key={u.slug} className="px-5 py-3.5 text-sm text-foreground">{row.format(u)}</td>
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
