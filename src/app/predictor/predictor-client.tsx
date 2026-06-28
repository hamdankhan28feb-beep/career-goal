'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { University } from '@/lib/types';

const CITIES = ['Karachi', 'Islamabad', 'Lahore', 'Peshawar', 'Quetta'];

function computeChance(score: number, univ: string): 'High' | 'Medium' | 'Low' {
  const toughness: Record<string, number> = {
    'IBA Karachi': 88, 'PIEAS': 92, 'FAST Karachi': 82, 'NEDUET': 80,
    'Habib University': 85, 'Bahria Karachi': 70, 'MAJU': 68,
    'SZABIST': 70, 'DSU': 72, 'DUET': 65, 'UoK': 60, 'SSUET': 62,
    'IoBM': 70, 'Iqra University': 60, 'COMSATS': 72,
    'Ziauddin University': 65, 'Indus University': 55, 'Hamdard University': 60,
  };
  const required = toughness[univ] ?? 65;
  const diff = score - required;
  if (diff >= 10) return 'High';
  if (diff >= 0) return 'Medium';
  return 'Low';
}

export default function PredictorClient({ universities }: { universities: University[] }) {
  const [form, setForm] = useState({ matricPct: '', interPct: '', city: 'Karachi', budgetLakh: '' });
  const [submitted, setSubmitted] = useState(false);

  const aggregate = form.matricPct && form.interPct
    ? parseFloat(form.interPct) * 0.6 + parseFloat(form.matricPct) * 0.4
    : 0;

  const budgetPkr = form.budgetLakh ? parseFloat(form.budgetLakh) * 100000 : 0;

  const results = submitted
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
        const chance = computeChance(aggregate, u.shortName);
        const toughScore = { High: 3, Medium: 2, Low: 1 }[chance];
        return { ...u, chance, toughScore };
      })
      .sort((a, b) => b.toughScore - a.toughScore)
    : [];

  const chanceConfig = {
    High: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, iconClass: 'text-emerald-500' },
    Medium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertCircle, iconClass: 'text-amber-500' },
    Low: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle, iconClass: 'text-red-500' },
  };

  const valid = form.matricPct && form.interPct && parseFloat(form.matricPct) >= 0 && parseFloat(form.interPct) >= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary mb-4">
          <TrendingUp className="h-4 w-4" /> AI-powered merit analysis
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Admission Predictor</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
          Enter your academic results and city preference. We&apos;ll analyze university merit data to predict your admission chances.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm lg:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Matric Percentage (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 85.5"
              value={form.matricPct}
              onChange={(e) => setForm((p) => ({ ...p, matricPct: e.target.value }))}
              className="input-field"
            />
            <p className="mt-1 text-xs text-muted-foreground">Your SSC / Matric percentage</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Intermediate Percentage (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 78.0"
              value={form.interPct}
              onChange={(e) => setForm((p) => ({ ...p, interPct: e.target.value }))}
              className="input-field"
            />
            <p className="mt-1 text-xs text-muted-foreground">Your HSSC / FSc / A-levels percentage</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">City Preference</label>
            <select
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              className="input-field"
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Annual Budget (Lakh PKR) <span className="text-muted-foreground font-normal">— optional</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g. 3.5"
              value={form.budgetLakh}
              onChange={(e) => setForm((p) => ({ ...p, budgetLakh: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        {/* Aggregate preview */}
        {aggregate > 0 && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="text-primary"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">Computed Aggregate: {aggregate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Inter 60% + Matric 40% (standard formula)</div>
            </div>
          </div>
        )}

        <button
          onClick={() => { if (valid) setSubmitted(true); }}
          disabled={!valid}
          className="btn-primary mt-6 disabled:opacity-40"
        >
          Predict My Chances <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Results */}
      {submitted && results.length > 0 && (
        <div className="mt-10">
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
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {(['High', 'Medium', 'Low'] as const).map((c) => {
              const count = results.filter((r) => r.chance === c).length;
              const { bg, color } = chanceConfig[c];
              return (
                <div key={c} className={`rounded-2xl border p-4 ${bg}`}>
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className="text-xs text-muted-foreground">{c} Chance Universities</div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {results.map((u) => {
              const cfg = chanceConfig[u.chance];
              const Icon = cfg.icon;
              return (
                <div key={u.slug} className={`flex items-center gap-4 rounded-2xl border p-4 ${u.chance === 'High' ? 'border-emerald-500/20 bg-emerald-500/5' : u.chance === 'Medium' ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <Icon className={`h-5 w-5 shrink-0 ${cfg.iconClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.city} · {u.universityType}</div>
                  </div>
                  <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                    {u.chance} Chance
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
            { step: '01', title: 'Aggregate Calculation', desc: 'We apply the standard formula: Inter 60% + Matric 40%' },
            { step: '02', title: 'Merit Comparison', desc: 'Your aggregate is compared against typical merit cutoffs for each university' },
            { step: '03', title: 'Chance Assessment', desc: 'High (≥10% above cutoff), Medium (at cutoff), Low (below cutoff)' },
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
          ⚠️ This is an estimate based on historical data. Actual merit varies yearly. Always apply to universities directly.
        </div>
      </section>
    </div>
  );
}
