import Link from 'next/link';
import { ArrowRight, Sparkles, Target, BookOpen, Award, TrendingUp, Users, Brain } from 'lucide-react';

import { FeaturedFields } from '@/components/featured-fields';
import { HeroOrbit } from '@/components/hero-orbit';
import { UniversityCard } from '@/components/university-card';
import { getFields, getFeaturedUniversities, getUniversities } from '@/lib/data';

const FEATURES = [
  { icon: BookOpen, title: 'University Explorer', desc: 'Browse 18+ verified Karachi universities with real data from official sources', href: '/universities' },
  { icon: TrendingUp, title: 'Admission Predictor', desc: 'Enter your marks and get instant High/Medium/Low admission chance predictions', href: '/predictor' },
  { icon: Award, title: 'Scholarship Finder', desc: 'Discover merit, need-based, sports and external scholarships available', href: '/universities' },
  { icon: Brain, title: 'AI Counselor', desc: 'Chat with our AI counselor trained on your university database', href: '/counselor' },
  { icon: Users, title: 'Career Quiz', desc: 'Take a 24-question assessment to find your perfect field match', href: '/quiz' },
  { icon: Target, title: 'Side-by-Side Compare', desc: 'Compare universities on 8 dimensions: fees, merit, scholarships & more', href: '/compare' },
];

export default async function HomePage() {
  const universities = await getFeaturedUniversities(12);
  const featuredUniversities = await getFeaturedUniversities(6);
  const fields = getFields();
  const allUniversities = await getUniversities();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
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
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Universities', value: allUniversities.length },
              { label: 'Fields Mapped', value: fields.length },
              { label: 'Career Paths', value: '100+' },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1.5 text-2xl font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <HeroOrbit universities={universities} />
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
            Enter your Matric %, Intermediate %, city, and budget. Our algorithm analyzes university merit data to predict your admission chances at each institution.
          </p>
          <Link href="/predictor" className="btn-primary mt-6 inline-flex">
            Try Predictor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3">
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
