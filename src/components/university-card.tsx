import Link from 'next/link';
import { ArrowRight, Building2, GraduationCap, ShieldCheck, Award, MapPin, FileCheck2 } from 'lucide-react';
import type { University } from '@/lib/types';
import { VerificationBadge } from '@/components/verification-badge';
import { profileHeadline, ratingsForSlug, universityBadge } from '@/lib/evidence';
import { initialsSize, logoInitials, profileCompleteness } from '@/lib/display-utils';

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
  const oric = ratingsForSlug(university.slug).find((r) => r.label === 'ORIC category');
  const verifyStatus = universityBadge(university.profile);
  const profile = university.profile;
  const profilePct = profileCompleteness(profile);
  const initials = logoInitials(university.shortName, university.name, university.city);

  // Only tiles backed by real data; nothing is shown as a placeholder "—".
  const stats = [
    typeof university.sourcedCampusCount === 'number' && university.sourcedCampusCount > 0 && { icon: Building2, value: university.sourcedCampusCount, label: university.sourcedCampusCount === 1 ? 'Campus' : 'Campuses' },
    university.programsCount > 0 && { icon: GraduationCap, value: university.programsCount, label: 'Programs' },
    university.scholarships.length > 0 && { icon: Award, value: university.scholarships.length, label: 'Scholarships' },
  ].filter(Boolean) as { icon: React.ElementType; value: number; label: string }[];

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-border/70 bg-card/80 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <VerificationBadge status={verifyStatus} />
              <span className="sr-only">Verification reflects matched research fields, not every fact on this profile.</span>
              {profile && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-700 dark:text-cyan-300"
                  title={`Detailed profile checked ${profile.last_checked}`}
                  data-testid="card-profile-chip"
                >
                  <FileCheck2 className="h-3 w-3" aria-hidden />
                  {profileHeadline(profile)} · {profile.field_counts.sourced} sourced
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
              {university.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {university.city}
              <span className="text-muted-foreground/60">· {university.universityType}</span>
              {university.yearEstablished && (
                <span className="text-muted-foreground/60">· Est. {university.yearEstablished}</span>
              )}
            </div>
          </div>
          {/* Logo tile: initials */}
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-gradient-to-br from-muted to-muted/50 font-bold uppercase text-foreground shadow-sm ${initialsSize(initials)}`}
            aria-hidden
          >
            {initials}
          </div>
        </div>

        {/* Stats Grid (only real values) */}
        {stats.length > 0 && (
          <div className={`mt-4 grid gap-2 text-xs ${stats.length === 3 ? 'grid-cols-3' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 p-2.5 text-center">
                <Icon className="mb-1 h-4 w-4 text-primary" />
                <div className="font-semibold text-foreground">{value}</div>
                <div className="text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        )}

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
            <span>Sourced fields</span>
            <span>{profilePct === null ? 'Not available' : `${profilePct}%`}</span>
          </div>
          {profilePct !== null && <DataBar pct={profilePct} />}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-border/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            {oric && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
            <span className="truncate">
              {oric ? `ORIC ${oric.value} · ${oric.year} · category` : 'ORIC category not on file'}
            </span>
          </div>
          <Link
            href={`/universities/${university.slug}`}
            className="inline-flex min-h-10 lg:min-h-0 shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition group-hover:gap-2.5"
          >
            View profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
