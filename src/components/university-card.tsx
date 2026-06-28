import Link from 'next/link';
import { ArrowRight, Building2, GraduationCap, Landmark, ShieldCheck, Award, MapPin } from 'lucide-react';
import type { University } from '@/lib/types';

function TypeBadge({ type }: { type: string }) {
  const cls = type === 'Public'
    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
}

function DataBar({ pct }: { pct: number }) {
  const color = pct >= 60 ? 'from-emerald-500 to-teal-400' : pct >= 30 ? 'from-amber-500 to-yellow-400' : 'from-slate-400 to-slate-300';
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted/70">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function UniversityCard({ university }: { university: University }) {
  const strengths = university.overview.majorStrengths.slice(0, 2);
  const accred = university.accreditations[0];

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-border/70 bg-card/80 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <TypeBadge type={university.universityType} />
              {accred && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  {accred.type ?? accred.body}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
              {university.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {university.city}
              {university.yearEstablished && (
                <span className="ml-2 text-muted-foreground/60">· Est. {university.yearEstablished}</span>
              )}
            </div>
          </div>
          {/* Logo placeholder */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-gradient-to-br from-muted to-muted/50 text-sm font-bold uppercase text-foreground shadow-sm">
            {university.shortName.slice(0, 3)}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 p-2.5 text-center">
            <Building2 className="mb-1 h-4 w-4 text-primary" />
            <div className="font-semibold text-foreground">{university.campuses.length || 1}</div>
            <div className="text-muted-foreground">Campus</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 p-2.5 text-center">
            <GraduationCap className="mb-1 h-4 w-4 text-primary" />
            <div className="font-semibold text-foreground">{university.programsCount || '—'}</div>
            <div className="text-muted-foreground">Programs</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 p-2.5 text-center">
            <Award className="mb-1 h-4 w-4 text-primary" />
            <div className="font-semibold text-foreground">{university.scholarships.length || '—'}</div>
            <div className="text-muted-foreground">Scholarships</div>
          </div>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {strengths.map((s) => (
              <span key={s} className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs text-primary/80">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Data completeness bar */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Profile completeness</span>
            <span>{university.dataCompleteness}%</span>
          </div>
          <DataBar pct={university.dataCompleteness} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-border/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {university.hecStatus ?? (university.universityType === 'Public' ? 'Public University' : 'Private University')}
          </div>
          <Link
            href={`/universities/${university.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition group-hover:gap-2.5"
          >
            View profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
