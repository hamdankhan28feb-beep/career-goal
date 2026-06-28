import Link from 'next/link';
import { getUniversities } from '@/lib/data';
import { Award, ArrowLeft } from 'lucide-react';

export default function AdminScholarshipsPage() {
  const universities = getUniversities();
  const allScholarships = universities.flatMap((u) =>
    u.scholarships.map((s) => ({ ...s, universityName: u.shortName, universitySlug: u.slug }))
  );

  const typeColor: Record<string, string> = {
    Merit: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'Need-Based': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    Sports: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    HEC: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    External: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Admin Dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Manage Scholarships</h1>
        <p className="mt-2 text-muted-foreground">{allScholarships.length} scholarships across {universities.length} universities</p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(['Merit', 'Need-Based', 'Sports', 'HEC'] as const).map((type) => {
          const count = allScholarships.filter((s) => s.scholarship_type === type).length;
          return (
            <div key={type} className="rounded-2xl border border-border/70 bg-card/80 p-4">
              <div className={`mb-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${typeColor[type]}`}>{type}</div>
              <div className="text-2xl font-bold text-foreground">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/80 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">Scholarship</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">University</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Type</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Coverage</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Renewable</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {allScholarships.map((s, i) => (
              <tr key={i} className="hover:bg-muted/20 transition">
                <td className="px-5 py-3.5 font-medium text-foreground max-w-[200px]">
                  <div className="truncate">{s.scholarship_name ?? 'Unnamed Scholarship'}</div>
                  {s.eligibility && <div className="text-xs text-muted-foreground truncate mt-0.5">{s.eligibility.slice(0, 60)}…</div>}
                </td>
                <td className="px-5 py-3.5">
                  <Link href={`/universities/${s.universitySlug}#scholarships`} className="text-primary hover:underline text-xs">
                    {s.universityName}
                  </Link>
                </td>
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  {s.scholarship_type && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${typeColor[s.scholarship_type] ?? 'bg-muted text-muted-foreground'}`}>
                      {s.scholarship_type}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  {s.coverage_percentage ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.coverage_percentage}%` }} />
                      </div>
                      <span className="text-xs">{s.coverage_percentage}%</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">{s.coverage_type ?? '—'}</span>}
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-xs">
                  {s.renewable ? <span className="text-emerald-500">✓ Yes</span> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition" disabled>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
