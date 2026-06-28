import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, Globe, BookOpen, Star, TrendingUp, Clock } from 'lucide-react';

import { getFields, getFieldBySlug } from '@/lib/fields-data';

export async function generateStaticParams() {
  return getFields().map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const field = getFieldBySlug(slug);
  if (!field) return { title: 'Field Not Found' };
  return {
    title: `${field.name} — Field Guide`,
    description: `Complete guide to ${field.name}: career paths, salary ranges, roadmap, and universities offering this field in Pakistan.`,
  };
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Hard: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'Very Hard': 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const DEMAND_COLOR: Record<string, string> = {
  Low: 'bg-slate-500/10 text-slate-500',
  Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  High: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'Very High': 'bg-primary/10 text-primary',
};

function Tag({ text, color }: { text: string; color?: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${color ?? 'bg-muted text-muted-foreground'}`}>
      {text}
    </span>
  );
}

export default async function FieldProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const field = getFieldBySlug(slug);
  if (!field) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition">Home</Link>
        <span>/</span>
        <Link href="/fields" className="hover:text-foreground transition">Fields</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{field.name}</span>
      </nav>

      {/* Hero */}
      <div className="overflow-hidden rounded-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white lg:p-12">
        <div className="flex items-start gap-6">
          <span className="text-6xl">{field.icon}</span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-200">{field.category}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${DIFFICULTY_COLOR[field.difficultyLevel]}`}>{field.difficultyLevel}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${DEMAND_COLOR[field.industryDemand]}`}>{field.industryDemand} demand</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{field.name}</h1>
            <p className="mt-3 max-w-3xl text-slate-300 leading-7">{field.overview}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: Clock, label: field.degreeDuration },
                { icon: TrendingUp, label: `PKR ${Math.round(field.salaryRange.min / 1000)}K–${Math.round(field.salaryRange.max / 1000)}K/month` },
                { icon: Briefcase, label: `${field.careerPaths.length} career paths` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Left Column */}
        <div className="space-y-8">

          {/* Why Choose */}
          <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> Why Choose {field.name}?
            </h2>
            <ul className="space-y-2.5">
              {field.whyChoose.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </section>

          {/* Skills Required */}
          <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <h2 className="mb-4 text-lg font-semibold">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {field.skillsRequired.map((s) => (
                <Tag key={s} text={s} color="bg-primary/10 text-primary" />
              ))}
            </div>
          </section>

          {/* Core Courses */}
          <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Core Courses
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {field.coreCourses.map((c, i) => (
                <div key={c} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-semibold">{i + 1}</span>
                  {c}
                </div>
              ))}
            </div>
          </section>

          {/* Electives */}
          {field.electives.length > 0 && (
            <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
              <h2 className="mb-4 text-lg font-semibold">Electives</h2>
              <div className="flex flex-wrap gap-2">
                {field.electives.map((e) => <Tag key={e} text={e} />)}
              </div>
            </section>
          )}

          {/* Career Paths */}
          <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Career Paths
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {field.careerPaths.map((c) => (
                <div key={c} className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
                  <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  {c}
                </div>
              ))}
            </div>
          </section>

          {/* Jobs Grid */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-blue-500" /> Government Jobs
              </div>
              <ul className="space-y-1.5">
                {field.governmentJobs.map((j) => (
                  <li key={j} className="text-xs text-muted-foreground">• {j}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-purple-500" /> Private Sector
              </div>
              <ul className="space-y-1.5">
                {field.privateSectorJobs.map((j) => (
                  <li key={j} className="text-xs text-muted-foreground">• {j}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4 text-emerald-500" /> Freelancing
              </div>
              <ul className="space-y-1.5">
                {field.freelancingOpportunities.map((j) => (
                  <li key={j} className="text-xs text-muted-foreground">• {j}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Roadmap */}
          <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <h2 className="mb-6 text-lg font-semibold">📍 Semester-by-Semester Roadmap</h2>
            <div className="space-y-4">
              {field.roadmap.map((sem, i) => (
                <div key={sem.semester} className="relative pl-8">
                  {i < field.roadmap.length - 1 && (
                    <div className="absolute left-3.5 top-8 h-full w-0.5 bg-border/70" />
                  )}
                  <div className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {sem.semester}
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester {sem.semester}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {sem.courses.map((c) => (
                        <span key={c} className="rounded-full bg-background border border-border/60 px-2.5 py-1 text-xs text-foreground">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Future Scope */}
          <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Future Scope
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">{field.futureScope}</p>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Salary Range */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <h3 className="mb-4 text-sm font-semibold">💰 Salary Range</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                PKR {Math.round(field.salaryRange.min / 1000)}K
                <span className="text-xl font-normal text-muted-foreground mx-2">–</span>
                {Math.round(field.salaryRange.max / 1000)}K
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{field.salaryRange.currency}</div>
            </div>
            <div className="mt-4 progress-track">
              <div className="progress-fill" style={{ width: '100%' }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Entry Level</span>
              <span>Senior Level</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <h3 className="mb-4 text-sm font-semibold">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{field.degreeDuration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Difficulty</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLOR[field.difficultyLevel]}`}>{field.difficultyLevel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Demand</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DEMAND_COLOR[field.industryDemand]}`}>{field.industryDemand}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Semesters</span>
                <span className="font-medium">{field.roadmap.length}</span>
              </div>
            </div>
          </div>

          {/* Higher Education */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <h3 className="mb-4 text-sm font-semibold">🎓 Higher Education Options</h3>
            <ul className="space-y-2">
              {field.higherEducationOptions.map((o) => (
                <li key={o} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />{o}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/quiz" className="btn-primary w-full justify-center">
              Take Career Quiz <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/compare/fields" className="btn-secondary w-full justify-center">
              Compare with other fields
            </Link>
            <Link href="/universities" className="btn-ghost w-full justify-center">
              Find universities for {field.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
