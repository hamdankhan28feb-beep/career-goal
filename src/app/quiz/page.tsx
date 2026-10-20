'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle2, Brain, RotateCcw } from 'lucide-react';
import { getFields } from '@/lib/fields-data';
import { QUIZ_OPTIONS as OPTIONS, QUIZ_QUESTIONS, quizCategories } from '@/lib/quiz-questions';

const RESULT_COLORS = ['from-primary to-cyan-500', 'from-purple-500 to-pink-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-red-400'];

type Answers = Record<string, number>;

type QuizResult = { slug: string; band: 'Strong' | 'Good' | 'Possible'; relative: number };
type QuizOutcome = { flat: boolean; results: QuizResult[] };

function computeResults(answers: Answers): QuizOutcome {
  const values = QUIZ_QUESTIONS.map((q) => answers[q.id]).filter((v): v is number => v !== undefined);
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const isFlat =
    values.length === QUIZ_QUESTIONS.length && values.every((v) => v === values[0]);

  if (isFlat) {
    return { flat: true, results: [] };
  }

  const fields = Object.keys(QUIZ_QUESTIONS[0].field_weights);
  const scores: Record<string, number> = {};
  fields.forEach((f) => { scores[f] = 0; });

  QUIZ_QUESTIONS.forEach((q) => {
    const ans = answers[q.id] ?? 0;
    const centered = ans - mean;
    const weights = q.field_weights as Record<string, number>;
    Object.entries(weights).forEach(([field, weight]) => {
      scores[field] = (scores[field] ?? 0) + centered * weight;
    });
  });

  const ranked = Object.entries(scores)
    .map(([slug, raw]) => ({ slug, raw }))
    .sort((a, b) => b.raw - a.raw);

  const top = ranked[0]?.raw ?? 0;
  const scale = Math.max(Math.abs(top), 1);
  const results: QuizResult[] = ranked.slice(0, 5).map((r, i) => {
    const gap = (top - r.raw) / scale;
    let band: QuizResult['band'] = 'Possible';
    if (i === 0 || gap < 0.08) band = 'Strong';
    else if (gap < 0.25) band = 'Good';
    return {
      slug: r.slug,
      band,
      relative: Math.max(5, Math.min(100, Math.round(55 + (r.raw / scale) * 40))),
    };
  });

  return { flat: false, results };
}

function explainMatch(slug: string, answers: Answers): string {
  const byCat = new Map<string, number>();
  for (const question of QUIZ_QUESTIONS) {
    const ans = answers[question.id];
    if (ans === undefined) continue;
    const weight = question.field_weights[slug] ?? 0;
    byCat.set(question.category, (byCat.get(question.category) ?? 0) + ans * weight);
  }
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
  if (!top.length) return 'Not enough answers to explain this suggestion.';
  return `Suggested because your higher answers lined up with ${top.join(' and ')}. This is an interest match only. It is not a job guarantee.`;
}

export default function QuizPage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);

  const allFields = getFields();
  const fieldMap = Object.fromEntries(allFields.map((f) => [f.slug, f]));

  const q = QUIZ_QUESTIONS[current];
  const progress = ((current) / QUIZ_QUESTIONS.length) * 100;
  const answered = q ? answers[q.id] !== undefined : false;

  function handleAnswer(val: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  }

  function next() {
    if (current < QUIZ_QUESTIONS.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setOutcome(computeResults(answers));
    }
  }

  function prev() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  function reset() {
    setStarted(false);
    setCurrent(0);
    setAnswers({});
    setOutcome(null);
  }

  if (outcome) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Career Match Results</h1>
          <p className="mt-3 text-muted-foreground">Based on your {QUIZ_QUESTIONS.length} answers across {quizCategories().length} categories. Matches are relative interest bands, not job guarantees and not admission decisions.</p>
        </div>
        <div className="space-y-4">
          {outcome.flat ? (
            <div role="status" data-testid="quiz-flat-warning" className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-foreground">
              Your answers were nearly identical across every question, so no field stands out yet.
              Retake the quiz with more varied answers, or ask the AI Counselor for guidance.
            </div>
          ) : null}
          {outcome.results.map((r, i) => {
            const field = fieldMap[r.slug];
            if (!field) return null;
            return (
              <div key={r.slug} data-testid="quiz-result" data-band={r.band} className={`relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-5 ${i === 0 ? 'ring-2 ring-primary' : ''}`}>
                {r.band === 'Strong' && (
                  <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Strong fit 🏆
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{field.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 ${r.band === 'Strong' ? 'pr-24 sm:pr-28' : ''}`}>
                      <h2 className="font-semibold text-foreground">{field.name}</h2>
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                    </div>
                    <div className="progress-track mb-1.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${RESULT_COLORS[i % RESULT_COLORS.length]} transition-all duration-1000`}
                        style={{ width: `${r.relative}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{field.category} · difficulty not available</span>
                      <span className="font-semibold text-foreground">{r.band} fit</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{explainMatch(r.slug, answers)}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{field.overview.slice(0, 120)}…</p>
                  <Link href={`/fields/${field.slug}`} className="shrink-0 rounded-xl border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/5 transition">
                    Explore →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button onClick={reset} className="btn-secondary">
            <RotateCcw className="h-4 w-4" /> Retake Quiz
          </button>
          <Link href="/counselor" className="btn-primary">
            Ask AI Counselor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="text-7xl mb-6">🧠</div>
        <h1 className="text-4xl font-semibold tracking-tight">Career Counseling Quiz</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-7">
          Answer {QUIZ_QUESTIONS.length} questions across {quizCategories().length} categories. Discover suggested career and field matches. These are interest suggestions, not job offers or admission decisions.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 text-left">
          {[
            { emoji: '⏱️', label: '~10 minutes', desc: 'Quick and focused' },
            { emoji: '🎯', label: `${quizCategories().length} categories`, desc: quizCategories().join(', ') },
            { emoji: '📊', label: 'Top 5 fields', desc: 'Relative interest bands (Strong / Good / Possible)' },
            { emoji: '🔄', label: 'Retakeable', desc: 'Try as many times as you like' },
          ].map(({ emoji, label, desc }) => (
            <div key={label} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/80 p-4">
              <span className="text-2xl">{emoji}</span>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" data-testid="quiz-start" onClick={() => setStarted(true)} className="btn-primary mt-8 text-base px-8 py-4">
          Start Quiz <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span className="font-medium text-primary">{q.category}</span>
          </div>
          <span className="text-muted-foreground">Question {current + 1} of {QUIZ_QUESTIONS.length}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-3xl border border-border/70 bg-card/80 p-8 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{q.question}</h2>
        <div className="mt-6 space-y-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label}
              aria-pressed={answers[q.id] === opt.value}
              data-testid={`quiz-option-${opt.value}`}
              onClick={() => handleAnswer(opt.value)}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                answers[q.id] === opt.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border/70 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                answers[q.id] === opt.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70'
              }`}>
                {answers[q.id] === opt.value ? <CheckCircle2 className="h-4 w-4" /> : opt.value}
              </div>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          onClick={prev}
          disabled={current === 0}
          className="btn-secondary disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        <button
          type="button"
          data-testid="quiz-next"
          onClick={next}
          disabled={!answered}
          className="btn-primary disabled:opacity-40"
        >
          {current === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
