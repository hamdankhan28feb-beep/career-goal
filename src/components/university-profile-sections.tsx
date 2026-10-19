'use client';

import { useState } from 'react';
import {
  Landmark, GraduationCap, BookOpen, DollarSign, Award, Building2, ShieldCheck, ExternalLink,
} from 'lucide-react';

import { SourceDrawer, type SourceCitation } from '@/components/source-drawer';
import { PROFILE_STATUS_LABEL } from '@/lib/profile-utils';
import type { ProfileField, ProfileFieldStatus, UniversityProfile } from '@/lib/types';


const SECTIONS: { key: keyof UniversityProfile['sections']; id: string; title: string; icon: React.ElementType }[] = [
  { key: 'overview', id: 'profile-overview', title: 'Overview & campus', icon: Landmark },
  { key: 'programs', id: 'profile-programs', title: 'Undergraduate programs', icon: GraduationCap },
  { key: 'admissions', id: 'profile-admissions', title: 'Eligibility & admissions', icon: BookOpen },
  { key: 'fees', id: 'profile-fees', title: 'Fees & expenses', icon: DollarSign },
  { key: 'scholarships', id: 'profile-scholarships', title: 'Scholarships & financial aid', icon: Award },
  { key: 'facilities', id: 'profile-facilities', title: 'Facilities', icon: Building2 },
];

/** Status is carried by the chip's coloured left border (plus an accessible label), not a separate badge. */
const STATUS_BORDER: Record<ProfileFieldStatus, string> = {
  verified: 'border-l-success',
  partial: 'border-l-warning',
  unavailable: 'border-l-slate-400/60',
  needs_verification: 'border-l-blue-500',
};
const STATUS_DOT: Record<ProfileFieldStatus, string> = {
  verified: 'bg-success',
  partial: 'bg-warning',
  unavailable: 'bg-slate-400/60',
  needs_verification: 'bg-blue-500',
};

const isQuiet = (f: ProfileField) => f.status === 'unavailable' || f.status === 'needs_verification' || !f.value;

function SourceChip({
  field, sourceId, title, onOpen,
}: { field: ProfileField; sourceId: string | null; title: string; onOpen?: () => void }) {
  const label = PROFILE_STATUS_LABEL[field.status];
  const cls = `inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-md border border-border/70 border-l-[3px] ${STATUS_BORDER[field.status]} bg-background/60 px-2 font-mono text-2xs font-semibold text-muted-foreground transition hover:border-primary/60 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:min-h-0 lg:min-w-0 lg:py-0.5`;
  const status = (
    <span data-testid="profile-field-status" data-status={field.status} className="sr-only">
      {label}
    </span>
  );
  if (!sourceId || !onOpen) {
    return (
      <span className={cls} title={label}>
        {status}
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[field.status]}`} />
      </span>
    );
  }
  return (
    <button type="button" onClick={onOpen} title={title} aria-label={`${label}. Source ${sourceId}: ${title}`} className={cls}>
      {status}
      [{sourceId}]
    </button>
  );
}

export function UniversityProfileSections({ profile }: { profile: UniversityProfile }) {
  const [open, setOpen] = useState<SourceCitation | null>(null);
  const sourceById = Object.fromEntries(profile.sources.map((s) => [s.id, s]));

  const citationFor = (f: ProfileField): SourceCitation | null => {
    const s = f.source ? sourceById[f.source] : undefined;
    if (!s) return null;
    return {
      ref: s.id,
      title: s.title,
      url: s.url,
      retrievedAt: s.checked,
      status: f.status === 'verified' || f.status === 'partial' ? f.status : null,
      excerpt: [`${f.label}: ${f.value ?? 'Not available'}`, f.note, s.note].filter(Boolean).join('\n'),
      kind: 'university-profile',
    };
  };

  const chipFor = (f: ProfileField) => {
    const cit = citationFor(f);
    const title = cit
      ? `${PROFILE_STATUS_LABEL[f.status]} · ${cit.title}${cit.retrievedAt ? ` · checked ${cit.retrievedAt}` : ''}`
      : PROFILE_STATUS_LABEL[f.status];
    return <SourceChip field={f} sourceId={cit?.ref ?? null} title={title} onOpen={cit ? () => setOpen(cit) : undefined} />;
  };

  const checkedFor = (f: ProfileField) => (f.source && sourceById[f.source]?.checked) || profile.last_checked;

  const c = profile.field_counts;

  return (
    <div className="space-y-12" data-testid="university-profile" data-profile-status={profile.profile_status}>
      <div className="rounded-3xl border border-border/70 bg-card/80 p-5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
          <span className="font-semibold">
            {profile.profile_status === 'complete' ? 'Detailed profile' : 'Partial profile'}
          </span>
          <span className="text-muted-foreground">checked {profile.last_checked}</span>
        </div>
        <p className="mt-2 text-muted-foreground">
          {c.sourced} sourced fields ({c.verified} verified, {c.partial} partial) · {c.unavailable} unavailable ·{' '}
          {c.needs_verification} need verification. Tap a [S#] chip to see the official source.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
          {(['verified', 'partial', 'needs_verification', 'unavailable'] as ProfileFieldStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-[3px] rounded-full ${STATUS_DOT[s]}`} />
              {PROFILE_STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      {SECTIONS.map(({ key, id, title, icon: Icon }) => {
        const fields = profile.sections[key];
        const main = fields.filter((f) => !isQuiet(f));
        const quiet = fields.filter(isQuiet);
        return (
          <section key={id} id={id} className="scroll-mt-32" data-testid={id}>
            <div className="flex items-center gap-3 border-b border-border/50 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            </div>
            <dl className="mt-5 overflow-hidden rounded-3xl border border-border/70 bg-card/80">
              <div className="divide-y divide-border/40">
                {main.map((f, i) => (
                  <div key={`${f.label}-${i}`} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 sm:px-5 sm:py-3.5">
                    <dt className="text-xs text-muted-foreground sm:w-52 sm:shrink-0 sm:pt-0.5 sm:text-sm">{f.label}</dt>
                    <dd className="flex min-w-0 flex-1 items-start gap-3 [overflow-wrap:anywhere]">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-foreground sm:text-[15px]">{f.value}</span>
                        {f.status === 'partial' && <span className="ml-2 text-2xs font-medium text-warning">partial</span>}
                        {f.note && <span className="mt-1 block text-xs text-muted-foreground">{f.note}</span>}
                      </div>
                      {chipFor(f)}
                    </dd>
                  </div>
                ))}
              </div>
              {quiet.length > 0 && (
                <div className={`bg-muted/20 px-4 py-2 sm:px-5 ${main.length ? 'border-t border-border/50' : ''}`} data-testid="profile-quiet-rows">
                  <div className="pb-1 pt-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground/80">
                    Not published officially / pending
                  </div>
                  {quiet.map((f, i) => (
                    <div key={`${f.label}-q-${i}`} className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
                      <dt className="min-w-0 flex-1 truncate sm:flex-none sm:w-52 sm:shrink-0" title={f.label}>{f.label}</dt>
                      <dd className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:justify-between">
                        <span className="hidden min-w-0 truncate italic sm:inline" title={f.note ?? undefined}>
                          {f.status === 'needs_verification'
                            ? `In an official document, not yet extracted · checked ${checkedFor(f)}`
                            : `Not published officially · checked ${checkedFor(f)}`}
                        </span>
                        <span className="italic sm:hidden">{f.status === 'needs_verification' ? 'Pending' : 'Not published'}</span>
                        {chipFor(f)}
                      </dd>
                    </div>
                  ))}
                </div>
              )}
            </dl>
          </section>
        );
      })}

      <section id="profile-sources" className="scroll-mt-32" data-testid="profile-sources">
        <div className="flex items-center gap-3 border-b border-border/50 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Official sources & verification</h2>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {profile.sources.map((s) => (
            <li key={s.id} className="rounded-2xl border border-border/70 bg-card/80 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">
                  <span className="mr-1 font-mono font-semibold text-primary">[{s.id}]</span>
                  {s.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">checked {s.checked}</span>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex min-h-10 items-center gap-1.5 break-all text-xs text-primary hover:underline lg:mt-2 lg:min-h-0 lg:items-start"
              >
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                {s.url}
              </a>
              {s.note && <p className="mt-2 text-xs text-muted-foreground">{s.note}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Statuses are per field and shown as the coloured edge of each [S#] chip: Verified = matches the cited official
          page on the date shown; Partial = sourced but incomplete, unlabelled period, or an older check; Unavailable = not
          published on official pages we read; Needs verification = exists in an official document but not yet extracted.
          Always confirm fees and deadlines on the official website before applying.
        </p>
      </section>

      <SourceDrawer open={!!open} citation={open} onClose={() => setOpen(null)} />
    </div>
  );
}
