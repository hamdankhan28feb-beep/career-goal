'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, X, BarChart2 } from 'lucide-react';
import { getFields } from '@/lib/fields-data';
import type { FieldDefinition } from '@/lib/types';

const COMPARE_ROWS: { key: string; label: string; format: (f: FieldDefinition) => string }[] = [
  { key: 'category', label: 'Category', format: (f) => f.category },
  { key: 'duration', label: 'Duration', format: (f) => f.degreeDuration },
  { key: 'difficulty', label: 'Difficulty', format: (f) => f.difficultyLevel },
  { key: 'demand', label: 'Industry Demand', format: (f) => f.industryDemand },
  { key: 'salary_min', label: 'Min Salary/Month', format: (f) => `PKR ${Math.round(f.salaryRange.min / 1000)}K` },
  { key: 'salary_max', label: 'Max Salary/Month', format: (f) => `PKR ${Math.round(f.salaryRange.max / 1000)}K` },
  { key: 'semesters', label: 'Semesters', format: (f) => String(f.roadmap.length) },
  { key: 'career_count', label: 'Career Paths', format: (f) => String(f.careerPaths.length) },
  { key: 'govt_jobs', label: 'Govt Jobs', format: (f) => String(f.governmentJobs.length) },
  { key: 'private_jobs', label: 'Private Jobs', format: (f) => String(f.privateSectorJobs.length) },
  { key: 'freelance', label: 'Freelancing', format: (f) => String(f.freelancingOpportunities.length) + ' options' },
  { key: 'higher_edu', label: 'Higher Edu Options', format: (f) => String(f.higherEducationOptions.length) },
  { key: 'core_courses', label: 'Core Courses', format: (f) => String(f.coreCourses.length) },
  { key: 'electives', label: 'Electives', format: (f) => String(f.electives.length) },
  { key: 'scope', label: 'Future Scope', format: (f) => f.futureScope.slice(0, 80) + '…' },
];

export default function CompareFieldsPage() {
  const allFields = getFields();
  const [selected, setSelected] = useState<FieldDefinition[]>([]);
  const [comparing, setComparing] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const filtered = allFields.filter((f) => {
    const q = searchQ.toLowerCase();
    return q === '' || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });

  function toggle(f: FieldDefinition) {
    if (selected.find((s) => s.slug === f.slug)) {
      setSelected((p) => p.filter((s) => s.slug !== f.slug));
    } else if (selected.length < 3) {
      setSelected((p) => [...p, f]);
    }
  }

  const isSel = (f: FieldDefinition) => selected.some((s) => s.slug === f.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary mb-4">
          <BarChart2 className="h-4 w-4" /> Field comparison tool
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Compare Fields</h1>
        <p className="mt-3 text-muted-foreground">Compare up to 3 fields side-by-side on salary, demand, difficulty, career paths, and more.</p>
      </div>

      {!comparing ? (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Selected ({selected.length}/3):</span>
            {selected.map((f) => (
              <div key={f.slug} className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary">
                <span>{f.icon} {f.name}</span>
                <button onClick={() => toggle(f)}><X className="h-3.5 w-3.5 hover:text-red-500" /></button>
              </div>
            ))}
            {selected.length >= 2 && (
              <button onClick={() => setComparing(true)} className="btn-primary py-2 text-sm">
                Compare <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <input type="text" placeholder="Search fields..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="input-field mb-6 max-w-md" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((f) => {
              const sel = isSel(f);
              const disabled = !sel && selected.length >= 3;
              return (
                <button key={f.slug} onClick={() => !disabled && toggle(f)} disabled={disabled}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${sel ? 'border-primary bg-primary/10' : disabled ? 'opacity-40 cursor-not-allowed border-border/40' : 'border-border/70 bg-card/80 hover:border-primary/30'}`}>
                  <span className="text-3xl">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.category}</div>
                  </div>
                  {sel && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Field Comparison</h2>
            <button onClick={() => setComparing(false)} className="btn-ghost text-sm">← Back</button>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-border/70 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="sticky left-0 bg-muted/80 backdrop-blur px-5 py-4 text-left text-xs font-semibold text-muted-foreground w-44">Metric</th>
                  {selected.map((f) => (
                    <th key={f.slug} className="px-5 py-4 text-left min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <span>{f.icon}</span>
                        <span className="font-semibold text-foreground">{f.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.key} className={`${i % 2 === 0 ? 'bg-card/40' : ''} hover:bg-muted/20`}>
                    <td className="sticky left-0 bg-muted/60 backdrop-blur px-5 py-3.5 text-xs font-semibold text-muted-foreground">{row.label}</td>
                    {selected.map((f) => (
                      <td key={f.slug} className="px-5 py-3.5 text-sm text-foreground">{row.format(f)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Career paths breakdown */}
          <div className="mt-8 grid gap-5" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
            {selected.map((f) => (
              <div key={f.slug} className="rounded-3xl border border-border/70 bg-card/80 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="font-semibold text-sm">{f.name}</h3>
                </div>
                <div className="mb-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Top Career Paths</div>
                  <ul className="space-y-1">
                    {f.careerPaths.slice(0, 5).map((c) => (
                      <li key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={`/fields/${f.slug}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Full roadmap <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
