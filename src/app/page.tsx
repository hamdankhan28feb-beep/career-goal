import Link from 'next/link';
import { ArrowRight, Sparkles, Target, BookOpen, Award, TrendingUp, Users, Brain } from 'lucide-react';

import { FeaturedFields } from '@/components/featured-fields';
import { UniversityCard } from '@/components/university-card';
import { getFields, getFeaturedUniversities, getUniversities } from '@/lib/data';
import { researchStats } from '@/lib/research-meta';
import { LiveStats } from '@/components/live-stats';
import { FreshnessLabel } from '@/components/freshness-label';
import { initialsSize, logoInitials } from '@/lib/display-utils';

const FEATURES = [
  { icon: BookOpen, title: 'University Explorer', desc: 'Browse Karachi universities with verification badges and official-source citations', href: '/universities' },
  { icon: TrendingUp, title: 'Admission Predictor', desc: 'Enter your marks for a rough High/Medium/Low indication against benchmark estimates (not official cutoffs)', href: '/predictor' },
  { icon: Award, title: 'Scholarship Finder', desc: 'Discover merit, need-based, sports and external scholarships available', href: '/scholarships' },
  { icon: Brain, title: 'AI Counselor', desc: 'Ask questions about Pakistani universities — answers grounded in our database when AI keys are configured', href: '/counselor' },
  { icon: Users, title: 'Career Quiz', desc: 'Take a 24-question assessment to find your perfect field match', href: '/quiz' },
  { icon: Target, title: 'Side-by-Side Compare', desc: 'Compare universities on 8 dimensions: fees, merit, scholarships & more', href: '/compare' },
];

export default async function HomePage() {
  const featuredUniversities = await getFeaturedUniversities(6);
  const fields = getFields();
  const allUniversities = await getUniversities();
  const stats = researchStats();

  // Detailed (sourced) profiles drive the hero panel and the stats; nothing here is hard-coded.
  const profiled = allUniversities.filter((u) => u.profile);
  const checkDates = profiled.map((u) => u.profile!.last_checked).sort();
  const latestCheck = checkDates.length ? checkDates[checkDates.length - 1] : null;
  const sourcedTotal = profiled.reduce((a, u) => a + u.profile!.field_counts.sourced, 0);
  const recent = [...profiled]
    .sort((a, b) => b.profile!.last_checked.localeCompare(a.profile!.last_checked) || b.profile!.field_counts.verified - a.profile!.field_counts.verified)
    .slice(0, 3);
  const freshest = [stats.checkedAt, latestCheck].filter(Boolean).sort().pop() ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            AI-powered guidance for Pakistani students
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Discover Your{' '}
            <span className="gradient-text">Future</span>{' '}
            With Confidence
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Explore universities, careers, scholarships and admission opportunities all in one place. Built for Pakistani students, starting with Karachi.
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
                  label: 'Karachi unis (research)',
                  value: stats.universitiesTotal,
                  hint:
                    String(stats.universitiesVerified) +
                    ' verified / ' +
                    String(stats.universitiesPartial) +
                    ' partial',
                },
                {
                  label: 'Detailed profiles',
                  value: profiled.length,
                  hint: latestCheck
                    ? String(sourcedTotal) + ' sourced fields · checked ' + latestCheck
                    : 'Sourced from official pages',
                },
                {
                  label: 'Scholarships tracked',
                  value: stats.scholarshipsTotal,
                  hint:
                    String(stats.scholarshipsActive) +
                    ' open / ' +
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
              <div className="text-sm font-semibold text-foreground">Recently verified</div>
              {latestCheck && <span className="text-xs text-muted-foreground">checked {latestCheck}</span>}
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
                          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-[3px] rounded-full bg-emerald-500" />{c.verified} verified</span>
                          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-[3px] rounded-full bg-amber-500" />{c.partial} partial</span>
                          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-[3px] rounded-full bg-slate-400/60" />{c.unavailable} unavailable</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href="/universities" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline lg:min-h-0">
              All {profiled.length} detailed profiles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </aside>
        )}
      </section>

      {/* ── Features Grid ─────────────────────────────────────────── */}
      <section className="mt-24">
        <div className="text-center">
          <div className="section-label">What We Offer</div>
          <h2 className="section-title">Everything a Pakistani student needs</h2>
          <p className="mt-3 text-muted-foreground">One platform. Zero guesswork.</p>
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
            <h2 className="section-title">Karachi-focused, verified, and comparison-ready</h2>
          </div>
          <Link href="/universities" className="hidden items-center gap-2 text-sm font-medium text-primary sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
          Every university and scholarship fact is labelled Verified, Approximate, Unverified, or Not available yet.
          We prefer HEC and official university pages. Missing fees or deadlines stay blank — we never invent them.
          Scholarship Finder currently shows tracked programmes with honest status (many are unknown or closed until a dated window reopens).
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400">Verified = official page checked</span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-400">Approximate = partial official data</span>
          <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">Unverified = HEC listing only so far</span>
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
      <section className="mt-24 overflow-hidden rounded-4xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-cyan-100">
            <Brain className="h-4 w-4" />
            Powered by AI + your database
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">
            Ask the AI Counselor anything about Pakistani universities
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            &ldquo;Which university is best for CS in Karachi?&rdquo; &bull; &ldquo;I have 75% in ICS, where can I apply?&rdquo; &bull; &ldquo;What is the difference between CS and AI?&rdquo;
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
            '✅ University admission requirements',
            '✅ Scholarship opportunities',
            '✅ Career path guidance',
            '✅ Merit predictions',
            '✅ Field comparisons',
            '✅ Entry test preparation tips',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 backdrop-blur">
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ── Admission Predictor CTA ───────────────────────────────── */}
      <section className="mt-12 grid gap-6 rounded-4xl border border-border/70 bg-card/80 p-8 shadow-sm lg:grid-cols-2">
        <div>
          <div className="section-label">Admission Predictor</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Know your chances before you apply</h2>
          <p className="mt-3 text-muted-foreground text-sm leading-7">
            Enter your Matric %, Intermediate %, city, and budget. We compare your aggregate with rough benchmark estimates (not official merit lists) for a High / Medium / Low indication. Admission is never guaranteed.
          </p>
          <Link href="/predictor" className="btn-primary mt-6 inline-flex">
            Try Predictor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Illustrative example only</div>
          {[
            { label: 'FAST Karachi', chance: 'High', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'NED University', chance: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'IBA Karachi', chance: 'Low', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
          ].map(({ label, chance, color, bg }) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/50 px-4 py-3">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className={`rounded-full ${bg} ${color} px-3 py-1 text-xs font-semibold`}>{chance} Chance</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
