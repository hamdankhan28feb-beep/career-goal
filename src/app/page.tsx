import Link from 'next/link';
import { ArrowRight, Sparkles, Target, BookOpen, Award, TrendingUp, Users, Brain } from 'lucide-react';

import { FeaturedFields } from '@/components/featured-fields';
import { UniversityCard } from '@/components/university-card';
import { getFields, getFeaturedUniversities, getUniversities } from '@/lib/data';
import { researchStats } from '@/lib/research-meta';
import { LiveStats } from '@/components/live-stats';
import { UniversityLogoSlider } from '@/components/university-logo-slider';
import { FreshnessLabel } from '@/components/freshness-label';
import { initialsSize, logoInitials } from '@/lib/display-utils';
import { latestVerificationDate, profileHeadline } from '@/lib/evidence';
import { COMPARISON_ROWS } from '@/lib/compare-rows';
import { QUIZ_QUESTIONS, quizCategories } from '@/lib/quiz-questions';
import { countBundledProfiles } from '@/lib/university-profiles';
import { universityLogos } from '@/data/university-logos';

const FEATURES = [
  { icon: BookOpen, title: 'University Explorer', desc: 'Browse universities with badges derived from field evidence, plus links to the cited pages', href: '/universities' },
  { icon: TrendingUp, title: 'Admission Predictor', desc: 'A chance label appears only when a sourced closing aggregate is on file. Otherwise the page says insufficient verified data.', href: '/predictor' },
  { icon: Award, title: 'Scholarship Finder', desc: 'Search tracked scholarships by status. Nothing is described as open unless the record says so.', href: '/scholarships' },
  { icon: Brain, title: 'AI Counselor', desc: 'Unavailable / Beta until a provider is configured. It does not invent citations.', href: '/counselor' },
  { icon: Users, title: 'Career Quiz', desc: `Discover suggested career and field matches. ${QUIZ_QUESTIONS.length} questions across ${quizCategories().length} categories.`, href: '/quiz' },
  { icon: Target, title: 'Side-by-Side Compare', desc: `Compare universities on ${COMPARISON_ROWS.length} rows. Missing figures show as Not available.`, href: '/compare' },
];

export default async function HomePage() {
  const featuredUniversities = await getFeaturedUniversities(6);
  const fields = getFields();
  const allUniversities = await getUniversities();
  const stats = researchStats();

  // Detailed (sourced) profiles drive the hero panel and the stats; nothing here is hard-coded.
  const profiled = allUniversities.filter((u) => u.profile);
  const sourcedTotal = profiled.reduce((a, u) => a + u.profile!.field_counts.sourced, 0);
  const recent = [...profiled]
    .sort((a, b) => (b.profile!.last_checked || '').localeCompare(a.profile!.last_checked || '') || b.profile!.field_counts.verified - a.profile!.field_counts.verified)
    .slice(0, 3);
  const freshest = latestVerificationDate();
  const profileFiles = countBundledProfiles();

  return (
    <div>
    <div className="container-page pt-10">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            Evidence-labelled guidance for Pakistani students
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            A growing university and career guide for Pakistan, starting with Karachi.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Discover suggested career and field matches. Counts below are generated from the records in this build, and each label says which file or list it comes from.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/universities" className="btn-primary">
              Explore Universities <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/quiz" className="btn-secondary">
              Find My Career Path <Target className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div>
            <LiveStats
              stats={[
                {
                  label: 'Research catalogue rows',
                  value: stats.universitiesTotal,
                  hint: 'universities_karachi.json',
                },
                {
                  label: 'Loaded university records',
                  value: allUniversities.length,
                  hint: `${profiled.length} of ${profileFiles} profile files attached · ${universityLogos.length} logo tiles`,
                },
                {
                  label: 'Scholarship catalogue rows',
                  value: stats.scholarshipsTotal,
                  hint:
                    String(stats.scholarshipsActive) +
                    ' open / ' +
                    String(stats.scholarshipsUpcoming) +
                    ' upcoming / ' +
                    String(stats.scholarshipsClosed) +
                    ' closed / ' +
                    String(stats.scholarshipsUnknown) +
                    ' unknown',
                },
              ]}
            />
            <div className="mt-3">
              <FreshnessLabel checkedAt={freshest} />
            </div>
          </div>
        </div>

        {/* Recently verified (real profile data) */}
        {recent.length > 0 && (
          <aside className="mt-10 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm lg:mt-0" data-testid="home-recently-verified">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">Profile files</div>
              {freshest && <span className="text-xs text-muted-foreground">verification log {freshest}</span>}
            </div>
            <ul className="mt-4 space-y-3">
              {recent.map((u) => {
                const p = u.profile!;
                const c = p.field_counts;
                const ini = logoInitials(u.shortName, u.name, u.city);
                return (
                  <li key={u.slug}>
                    <Link
                      href={`/universities/${u.slug}`}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/40"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted font-bold text-foreground ${initialsSize(ini)}`} aria-hidden>
                        {ini}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{p.official_name || u.name}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-[3px] rounded-full bg-success" />{c.verified} verified</span>
                          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-[3px] rounded-full bg-warning" />{c.partial} partial</span>
                          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-[3px] rounded-full bg-muted-foreground/50" />{profileHeadline(p)}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href="/universities" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline lg:min-h-0">
              All {allUniversities.length} loaded records <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </aside>
        )}
      </section>
    </div>

      {/* University logo slider: full-bleed band directly below the hero */}
      <UniversityLogoSlider />

    <div className="container-page pb-20">
      {/* Features Grid */}
      <section className="mt-16 lg:mt-24">
        <div className="text-center">
          <div className="section-label">What We Offer</div>
          <h2 className="section-title">Everything a Pakistani student needs</h2>
          <p className="mt-3 text-muted-foreground">Each tool says what it can and cannot show.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, href }) => (
            <Link
              key={href + title}
              href={href}
              data-testid={`home-feature${href.replace(/\//g, '-')}`}
              className="group rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Universities ─────────────────────────────────── */}
      <section className="mt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="section-label">Featured Universities</div>
            <h2 className="section-title">Karachi-focused university records</h2>
          </div>
          <Link href="/universities" className="hidden items-center gap-2 text-sm font-medium text-primary sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredUniversities.map((university) => (
            <UniversityCard key={university.slug} university={university} />
          ))}
        </div>
        <div className="mt-6 sm:hidden">
          <Link href="/universities" className="btn-secondary w-full justify-center">
            View all universities <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Field Explorer ────────────────────────────────────────── */}
      
      <section className="mt-24 rounded-4xl border border-border/70 bg-card/80 p-8 shadow-sm">
        <div className="section-label">Evidence Atlas</div>
        <h2 className="section-title">How we verify data</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Every fact is labelled from its own evidence. Verified means a reliable source supports that field for the stated period.
          Approximate means an explicit estimate with a disclosed basis. Unverified means the evidence is not sufficient.
          Fees, deadlines and merit figures stay blank when they are unverified. Scholarship rows keep their recorded status; none are called open unless the record says so.
          {sourcedTotal} profile fields currently remain sourced after the verification gate.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-success">Verified = source supports that field for the period</span>
          <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-warning">Approximate = estimate with a disclosed basis</span>
          <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">Unverified = insufficient evidence</span>
        </div>
      </section>

<section className="mt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="section-label">Field Explorer</div>
            <h2 className="section-title">Choose a path with clarity, not guesswork</h2>
          </div>
          <Link href="/fields" className="hidden items-center gap-2 text-sm font-medium text-primary sm:inline-flex">
            Explore all fields <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8">
          <FeaturedFields fields={fields} />
        </div>
      </section>

      {/* ── AI Counselor CTA ─────────────────────────────────────── */}
      <section className="mt-16 overflow-hidden rounded-4xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-white sm:p-8 lg:mt-24 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-cyan-100">
            <Brain className="h-4 w-4" />
            Unavailable / Beta
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">
            AI Counselor
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            When a provider is configured, answers stay inside verified records and say they are not official advice. Until then the counselor is unavailable and does not invent an answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/counselor" className="btn-primary bg-white text-slate-900 hover:bg-white/90">
              Start Chatting <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/quiz" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5">
              Take Career Quiz
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
          {[
            'Universities, with source links',
            'Scholarship records and their status',
            'Suggested field matches from the quiz',
            'Not official admissions advice',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 backdrop-blur">
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ── Admission Predictor CTA ───────────────────────────────── */}
      <section className="mt-12 grid gap-6 rounded-4xl border border-border/70 bg-card/80 p-5 shadow-sm sm:p-8 md:grid-cols-2">
        <div>
          <div className="section-label">Admission Predictor</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Chances only where a sourced aggregate exists</h2>
          <p className="mt-3 text-muted-foreground text-sm leading-7">
            The predictor lists every university in the loaded set. If that university has no sourced closing aggregate (programme, year and URL), it says insufficient verified data. It does not show High, Medium or Low, and it does not call any figure an official cutoff.
          </p>
          <Link href="/predictor" className="btn-primary mt-6 inline-flex">
            Open predictor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl border border-border/70 bg-muted/50 px-4 py-4 text-sm text-muted-foreground">
            Marks and budget stay in the browser for that visit. They are not stored and are not sent to an API. The privacy page describes this.
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}
