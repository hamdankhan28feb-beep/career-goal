'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { University } from '@/lib/types';
import {
  AGGREGATE_FORMULA,
  computeAggregate,
  computeChance,
  validateBudget,
  validatePercent,
  type Chance,
} from '@/lib/predictor';

const CITIES = ['Karachi', 'Islamabad', 'Lahore', 'Peshawar', 'Quetta'];

type ResultChance = Chance | 'No benchmark';

export default function PredictorClient({ universities }: { universities: University[] }) {
  const [form, setForm] = useState({ matricPct: '', interPct: '', city: 'Karachi', budgetLakh: '' });
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({ matricPct: false, interPct: false, budgetLakh: false });

  const matricCheck = validatePercent(form.matricPct, 'Matric percentage');
  const interCheck = validatePercent(form.interPct, 'Intermediate percentage');
  const budgetCheck = validateBudget(form.budgetLakh);
  const valid = matricCheck.ok && interCheck.ok && budgetCheck.ok;

  const aggregate = matricCheck.ok && interCheck.ok ? computeAggregate(matricCheck.value, interCheck.value) : null;
  const budgetPkr = budgetCheck.ok && budgetCheck.value ? budgetCheck.value * 100000 : 0;

  const showResults = submitted && valid && aggregate !== null;

  const results = showResults
    ? universities
      .filter((u) => !form.city || u.city === form.city)
      .filter((u) => {
        if (!budgetPkr) return true;
        const annualFee = u.fees?.semester_fee
          ? u.fees.semester_fee * 2
          : u.fees?.approx_total_degree_cost
          ? u.fees.approx_total_degree_cost / 4
          : 0;
        return annualFee === 0 || annualFee <= budgetPkr;
      })
      .map((u) => {
        const chance: ResultChance = computeChance(aggregate ?? 0, u.shortName) ?? 'No benchmark';
        const toughScore = { High: 3, Medium: 2, Low: 1, 'No benchmark': 0 }[chance];
        return { ...u, chance, toughScore };
      })
      .sort((a, b) => b.toughScore - a.toughScore)
    : [];

  const chanceConfig = {
    High: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', row: 'border-emerald-500/20 bg-emerald-500/5', icon: CheckCircle2, iconClass: 'text-emerald-500', badge: 'High Chance' },
    Medium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', row: 'border-amber-500/20 bg-amber-500/5', icon: AlertCircle, iconClass: 'text-amber-500', badge: 'Medium Chance' },
    Low: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/20', row: 'border-red-500/20 bg-red-500/5', icon: XCircle, iconClass: 'text-red-500', badge: 'Low Chance' },
    'No benchmark': { color: 'text-muted-foreground', bg: 'bg-muted/50 border-border/70', row: 'border-border/70 bg-muted/30', icon: HelpCircle, iconClass: 'text-muted-foreground', badge: 'No benchmark' },
  } as const;

  const matricError = (touched.matricPct || submitted) && !matricCheck.ok ? matricCheck.error : null;
  const interError = (touched.interPct || submitted) && !interCheck.ok ? interCheck.error : null;
  const budgetError = (touched.budgetLakh || submitted) && !budgetCheck.ok ? budgetCheck.error : null;

  function handlePredict() {
    setTouched({ matricPct: true, interPct: true, budgetLakh: true });
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary mb-4">
          <TrendingUp className="h-4 w-4" /> Rough estimate, not an official prediction
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Admission Predictor</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
          Enter your academic results and city preference. We compare your aggregate against rough benchmark estimates
          (not official merit lists) to give a High / Medium / Low indication. Admission is never guaranteed.
        </p>
      </div>

      {/* Form */}
      <form
        noValidate
        onSubmit={(e) => { e.preventDefault(); handlePredict(); }}
        className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm lg:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="matricPct" className="mb-2 block text-sm font-medium text-foreground">
              Matric Percentage (%)
            </label>
            <input
              id="matricPct"
              name="matricPct"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 85.5"
              value={form.matricPct}
              aria-invalid={matricError ? true : undefined}
              aria-describedby={matricError ? 'matricPct-error' : 'matricPct-hint'}
              onChange={(e) => setForm((p) => ({ ...p, matricPct: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, matricPct: true }))}
              className="input-field"
            />
            {matricError ? (
              <p id="matricPct-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{matricError}</p>
            ) : (
              <p id="matricPct-hint" className="mt-1 text-xs text-muted-foreground">Your SSC / Matric percentage (0–100)</p>
            )}
          </div>
          <div>
            <label htmlFor="interPct" className="mb-2 block text-sm font-medium text-foreground">
              Intermediate Percentage (%)
            </label>
            <input
              id="interPct"
              name="interPct"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 78.0"
              value={form.interPct}
              aria-invalid={interError ? true : undefined}
              aria-describedby={interError ? 'interPct-error' : 'interPct-hint'}
              onChange={(e) => setForm((p) => ({ ...p, interPct: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, interPct: true }))}
              className="input-field"
            />
            {interError ? (
              <p id="interPct-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{interError}</p>
            ) : (
              <p id="interPct-hint" className="mt-1 text-xs text-muted-foreground">Your HSSC / FSc / A-levels percentage (0–100)</p>
            )}
          </div>
          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-medium text-foreground">City Preference</label>
            <select
              id="city"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              className="input-field"
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="budgetLakh" className="mb-2 block text-sm font-medium text-foreground">
              Annual Budget (Lakh PKR) <span className="text-muted-foreground font-normal">— optional</span>
            </label>
            <input
              id="budgetLakh"
              name="budgetLakh"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 3.5"
              value={form.budgetLakh}
              aria-invalid={budgetError ? true : undefined}
              aria-describedby={budgetError ? 'budgetLakh-error' : undefined}
              onChange={(e) => setForm((p) => ({ ...p, budgetLakh: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, budgetLakh: true }))}
              className="input-field"
            />
            {budgetError ? (
              <p id="budgetLakh-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{budgetError}</p>
            ) : null}
          </div>
        </div>

        {/* Aggregate preview */}
        {aggregate !== null && (
          <div data-testid="predictor-aggregate" className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="text-primary"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">Computed Aggregate: {aggregate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{AGGREGATE_FORMULA}. Many universities also weigh an entry test, which this tool does not include.</div>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary mt-6">
          Predict My Chances <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Results */}
      {showResults && results.length === 0 && (
        <div data-testid="predictor-empty" className="mt-10 rounded-2xl border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground">
          No universities in {form.city} match your filters in our dataset yet. Try another city or remove the budget filter.
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="mt-10" data-testid="predictor-results">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results for {form.city}</h2>
            <div className="flex items-center gap-3 text-sm">
              {(['High', 'Medium', 'Low'] as const).map((c) => (
                <span key={c} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${chanceConfig[c].bg} ${chanceConfig[c].color}`}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            {(['High', 'Medium', 'Low', 'No benchmark'] as const).map((c) => {
              const count = results.filter((r) => r.chance === c).length;
              const { bg, color } = chanceConfig[c];
              return (
                <div key={c} className={`rounded-2xl border p-4 ${bg}`}>
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className="text-xs text-muted-foreground">{c === 'No benchmark' ? 'No benchmark in our data' : `${c} Chance Universities`}</div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {results.map((u) => {
              const cfg = chanceConfig[u.chance];
              const Icon = cfg.icon;
              return (
                <div key={u.slug} data-testid="predictor-row" className={`flex items-center gap-4 rounded-2xl border p-4 ${cfg.row}`}>
                  <Icon className={`h-5 w-5 shrink-0 ${cfg.iconClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.city} · {u.universityType}
                      {u.chance === 'No benchmark' ? ' · No benchmark yet — check the official merit list' : ''}
                    </div>
                  </div>
                  <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                    {cfg.badge}
                  </div>
                  <Link href={`/universities/${u.slug}`} className="shrink-0 text-xs text-primary hover:underline">
                    Profile →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => { setSubmitted(false); }}
              className="btn-secondary"
            >
              Change Inputs
            </button>
            <Link href="/compare" className="btn-primary">
              Compare Universities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* How it works */}
      <section className="mt-12 rounded-3xl border border-border/70 bg-card/80 p-6">
        <h2 className="mb-4 text-lg font-semibold">How the Predictor Works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '01', title: 'Aggregate Calculation', desc: `We apply a simple formula: ${AGGREGATE_FORMULA}. Real admissions often add an entry test.` },
            { step: '02', title: 'Benchmark Comparison', desc: 'Your aggregate is compared with a rough benchmark estimate per university. These are not official or published cutoffs.' },
            { step: '03', title: 'Chance Assessment', desc: 'High (10+ points above benchmark), Medium (0–10 points above), Low (below). No benchmark = we do not guess.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{step}</div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300">
          ⚠️ This is a rough indication, not a guarantee of admission. Benchmarks are FuturePath estimates, not verified merit lists, and actual merit varies every year.
          Always check the university&apos;s official merit list and apply directly.
        </div>
      </section>
    </div>
  );
}
