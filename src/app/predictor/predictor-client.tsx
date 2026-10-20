'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, HelpCircle } from 'lucide-react';
import type { University } from '@/lib/types';
import { chanceForUniversity, computeAggregate, meritAggregates, validateBudget, validatePercent } from '@/lib/predictor';

const CITIES = ['Karachi', 'Islamabad', 'Lahore', 'Peshawar', 'Quetta'];

export default function PredictorClient({ universities }: { universities: University[] }) {
  const [form, setForm] = useState({ matricPct: '', interPct: '', city: 'Karachi', budgetLakh: '' });
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({ matricPct: false, interPct: false, budgetLakh: false });

  const matricCheck = validatePercent(form.matricPct, 'Matric percentage');
  const interCheck = validatePercent(form.interPct, 'Intermediate percentage');
  const budgetCheck = validateBudget(form.budgetLakh);
  const valid = matricCheck.ok && interCheck.ok && budgetCheck.ok;
  const showResults = submitted && valid;
  const sourced = meritAggregates();

  const results = showResults
    ? universities
        .filter((u) => !form.city || u.city === form.city)
        .map((u) => {
          const hit = matricCheck.ok && interCheck.ok ? chanceForUniversity(computeAggregate(matricCheck.value, interCheck.value), u.slug) : null;
          return { university: u, hit };
        })
    : [];

  const matricError = (touched.matricPct || submitted) && !matricCheck.ok ? matricCheck.error : null;
  const interError = (touched.interPct || submitted) && !interCheck.ok ? interCheck.error : null;
  const budgetError = (touched.budgetLakh || submitted) && !budgetCheck.ok ? budgetCheck.error : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary mb-4">
          <TrendingUp className="h-4 w-4" /> Not an official cutoff
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Admission Predictor</h1>
        <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
          A High, Medium or Low label is shown only for a university that has a sourced closing aggregate: the university, the programme, the year and a source URL. Every other university is listed as insufficient verified data. Nothing here is an official cutoff.
        </p>
      </div>

      <form
        noValidate
        onSubmit={(e) => { e.preventDefault(); setTouched({ matricPct: true, interPct: true, budgetLakh: true }); setSubmitted(true); }}
        className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm lg:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="matricPct" className="mb-2 block text-sm font-medium text-foreground">Matric percentage (%)</label>
            <input id="matricPct" name="matricPct" type="text" inputMode="decimal" autoComplete="off" value={form.matricPct} aria-invalid={matricError ? true : undefined} onChange={(e) => setForm((p) => ({ ...p, matricPct: e.target.value }))} onBlur={() => setTouched((t) => ({ ...t, matricPct: true }))} className="input-field" />
            {matricError ? <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{matricError}</p> : null}
          </div>
          <div>
            <label htmlFor="interPct" className="mb-2 block text-sm font-medium text-foreground">Intermediate percentage (%)</label>
            <input id="interPct" name="interPct" type="text" inputMode="decimal" autoComplete="off" value={form.interPct} aria-invalid={interError ? true : undefined} onChange={(e) => setForm((p) => ({ ...p, interPct: e.target.value }))} onBlur={() => setTouched((t) => ({ ...t, interPct: true }))} className="input-field" />
            {interError ? <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{interError}</p> : null}
          </div>
          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-medium text-foreground">City</label>
            <select id="city" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="input-field">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="budgetLakh" className="mb-2 block text-sm font-medium text-foreground">Annual budget (lakh PKR) <span className="font-normal text-muted-foreground">— optional, not used to filter</span></label>
            <input id="budgetLakh" name="budgetLakh" type="text" inputMode="decimal" autoComplete="off" value={form.budgetLakh} aria-invalid={budgetError ? true : undefined} onChange={(e) => setForm((p) => ({ ...p, budgetLakh: e.target.value }))} onBlur={() => setTouched((t) => ({ ...t, budgetLakh: true }))} className="input-field" />
            {budgetError ? <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{budgetError}</p> : null}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Marks and budget stay in this page. They are not stored and are not sent to a server. Budget is not applied, because no sourced annual fee is on file.</p>
        <button type="submit" className="btn-primary mt-6">Check sourced aggregates <ArrowRight className="h-4 w-4" /></button>
      </form>

      {showResults && (
        <div className="mt-10" data-testid="predictor-results">
          <h2 className="text-xl font-semibold">Every loaded university in {form.city}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{sourced.length} sourced closing aggregate{sourced.length === 1 ? '' : 's'} on file.</p>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground" data-testid="predictor-empty">No loaded university is in {form.city}.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {results.map(({ university: u, hit }) => (
                <li key={u.slug} data-testid="predictor-row" className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card/80 p-4">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{u.name}</div>
                    {hit ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {hit.chance} relative to the sourced aggregate for {hit.merit.programme} ({hit.merit.academic_year}). Not an official cutoff.{' '}
                        <a href={hit.merit.source_url} className="text-primary hover:underline">{hit.merit.source_title || 'Source'}</a>
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Insufficient verified data</p>
                    )}
                  </div>
                  <Link href={`/universities/${u.slug}`} className="shrink-0 text-xs text-primary hover:underline">Profile</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <section className="mt-12 rounded-3xl border border-border/70 bg-card/80 p-6">
        <h2 className="mb-3 text-lg font-semibold">Sources and limits</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>A chance needs a closing or merit aggregate tied to one university, one programme, one academic year and a source URL that was checked.</li>
          <li>Universities without that record are still listed. Their result is insufficient verified data, with no High, Medium or Low label.</li>
          <li>There is no single formula applied as if every university used it. A weighted comparison is used only next to a sourced aggregate, and it is not called an official cutoff.</li>
          <li>Entry tests, interviews and quota seats are not modelled.</li>
        </ul>
      </section>
    </div>
  );
}
