'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle2, Brain, RotateCcw } from 'lucide-react';
import { getFields } from '@/lib/fields-data';

const QUIZ_QUESTIONS = [
  // Math & Logic
  { id: 'q1', category: 'Math & Logic', question: 'How much do you enjoy solving complex mathematical problems?', field_weights: { 'computer-science': 4, 'software-engineering': 4, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 5, 'civil-engineering': 4, 'bba': 2, 'accounting-finance': 3, 'mbbs': 2, 'pharmacy': 2, 'psychology': 2, 'architecture': 2, 'cyber-security': 3 } },
  { id: 'q2', category: 'Math & Logic', question: 'How comfortable are you with statistics and probability?', field_weights: { 'computer-science': 3, 'software-engineering': 3, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 3, 'civil-engineering': 3, 'bba': 3, 'accounting-finance': 4, 'mbbs': 2, 'pharmacy': 2, 'psychology': 4, 'architecture': 2, 'cyber-security': 2 } },
  { id: 'q3', category: 'Math & Logic', question: 'Do you enjoy logic puzzles and algorithm challenges?', field_weights: { 'computer-science': 5, 'software-engineering': 5, 'artificial-intelligence': 5, 'data-science': 4, 'electrical-engineering': 4, 'civil-engineering': 3, 'bba': 2, 'accounting-finance': 2, 'mbbs': 2, 'pharmacy': 2, 'psychology': 3, 'architecture': 2, 'cyber-security': 5 } },
  // Programming
  { id: 'q4', category: 'Programming', question: 'How much do you enjoy writing code and building software?', field_weights: { 'computer-science': 5, 'software-engineering': 5, 'artificial-intelligence': 5, 'data-science': 4, 'electrical-engineering': 3, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 2, 'cyber-security': 5 } },
  { id: 'q5', category: 'Programming', question: 'How interested are you in building websites or mobile apps?', field_weights: { 'computer-science': 5, 'software-engineering': 5, 'artificial-intelligence': 3, 'data-science': 3, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 2, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 3, 'cyber-security': 4 } },
  { id: 'q6', category: 'Programming', question: 'Do you enjoy finding and fixing bugs in code or systems?', field_weights: { 'computer-science': 4, 'software-engineering': 5, 'artificial-intelligence': 3, 'data-science': 3, 'electrical-engineering': 3, 'civil-engineering': 2, 'bba': 1, 'accounting-finance': 2, 'mbbs': 2, 'pharmacy': 2, 'psychology': 2, 'architecture': 1, 'cyber-security': 5 } },
  // Biology & Medicine
  { id: 'q7', category: 'Biology & Medicine', question: 'How passionate are you about biology, human anatomy, or medicine?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 5, 'pharmacy': 5, 'psychology': 4, 'architecture': 1, 'cyber-security': 1 } },
  { id: 'q8', category: 'Biology & Medicine', question: 'Do you want to directly help patients in a clinical setting?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 5, 'pharmacy': 4, 'psychology': 5, 'architecture': 1, 'cyber-security': 1 } },
  { id: 'q9', category: 'Biology & Medicine', question: 'How interested are you in pharmaceutical sciences and drugs?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 2, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 2, 'accounting-finance': 1, 'mbbs': 4, 'pharmacy': 5, 'psychology': 2, 'architecture': 1, 'cyber-security': 1 } },
  // Business
  { id: 'q10', category: 'Business', question: 'How much do you enjoy leadership and managing teams?', field_weights: { 'computer-science': 2, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 3, 'bba': 5, 'accounting-finance': 3, 'mbbs': 2, 'pharmacy': 2, 'psychology': 3, 'architecture': 3, 'cyber-security': 2 } },
  { id: 'q11', category: 'Business', question: 'Are you interested in marketing, sales, or brand building?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 2, 'data-science': 3, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 5, 'accounting-finance': 2, 'mbbs': 1, 'pharmacy': 2, 'psychology': 2, 'architecture': 2, 'cyber-security': 1 } },
  { id: 'q12', category: 'Business', question: 'How interested are you in entrepreneurship and starting your own business?', field_weights: { 'computer-science': 3, 'software-engineering': 3, 'artificial-intelligence': 3, 'data-science': 3, 'electrical-engineering': 2, 'civil-engineering': 3, 'bba': 5, 'accounting-finance': 4, 'mbbs': 2, 'pharmacy': 3, 'psychology': 3, 'architecture': 4, 'cyber-security': 3 } },
  // Creativity & Design
  { id: 'q13', category: 'Creativity & Design', question: 'How much do you enjoy drawing, design, or visual art?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 1, 'civil-engineering': 2, 'bba': 2, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 5, 'cyber-security': 1 } },
  { id: 'q14', category: 'Creativity & Design', question: 'Are you interested in designing spaces, buildings, or environments?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 2, 'civil-engineering': 4, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 5, 'cyber-security': 1 } },
  { id: 'q15', category: 'Creativity & Design', question: 'Do you enjoy working on UI/UX or digital design projects?', field_weights: { 'computer-science': 4, 'software-engineering': 3, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 3, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 5, 'cyber-security': 2 } },
  // Communication & Social
  { id: 'q16', category: 'Communication', question: 'How much do you enjoy communicating with and helping people?', field_weights: { 'computer-science': 2, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 2, 'bba': 4, 'accounting-finance': 3, 'mbbs': 5, 'pharmacy': 4, 'psychology': 5, 'architecture': 3, 'cyber-security': 2 } },
  { id: 'q17', category: 'Communication', question: 'Are you interested in understanding human behavior and emotions?', field_weights: { 'computer-science': 2, 'software-engineering': 1, 'artificial-intelligence': 3, 'data-science': 2, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 3, 'accounting-finance': 2, 'mbbs': 3, 'pharmacy': 2, 'psychology': 5, 'architecture': 3, 'cyber-security': 2 } },
  { id: 'q18', category: 'Communication', question: 'Do you enjoy public speaking and presenting ideas?', field_weights: { 'computer-science': 2, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 3, 'bba': 5, 'accounting-finance': 3, 'mbbs': 3, 'pharmacy': 2, 'psychology': 4, 'architecture': 3, 'cyber-security': 2 } },
  // Research
  { id: 'q19', category: 'Research', question: 'How much do you enjoy conducting experiments and research?', field_weights: { 'computer-science': 3, 'software-engineering': 2, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 4, 'civil-engineering': 3, 'bba': 2, 'accounting-finance': 2, 'mbbs': 4, 'pharmacy': 4, 'psychology': 5, 'architecture': 3, 'cyber-security': 3 } },
  { id: 'q20', category: 'Research', question: 'Are you interested in data analysis and finding patterns in data?', field_weights: { 'computer-science': 4, 'software-engineering': 3, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 3, 'civil-engineering': 2, 'bba': 3, 'accounting-finance': 4, 'mbbs': 3, 'pharmacy': 3, 'psychology': 4, 'architecture': 2, 'cyber-security': 3 } },
  // Infrastructure
  { id: 'q21', category: 'Infrastructure', question: 'How interested are you in building infrastructure like roads, bridges, dams?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 3, 'civil-engineering': 5, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 4, 'cyber-security': 1 } },
  { id: 'q22', category: 'Infrastructure', question: 'Do you enjoy working with electrical circuits and electronics?', field_weights: { 'computer-science': 3, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 1, 'electrical-engineering': 5, 'civil-engineering': 2, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 1, 'cyber-security': 3 } },
  // Security
  { id: 'q23', category: 'Security', question: 'How interested are you in network security and ethical hacking?', field_weights: { 'computer-science': 4, 'software-engineering': 3, 'artificial-intelligence': 3, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 1, 'cyber-security': 5 } },
  { id: 'q24', category: 'Security', question: 'Do you enjoy protecting systems and investigating cyber threats?', field_weights: { 'computer-science': 3, 'software-engineering': 3, 'artificial-intelligence': 3, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 1, 'cyber-security': 5 } },
];

const OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Very much' },
];

const RESULT_COLORS = ['from-primary to-cyan-500', 'from-purple-500 to-pink-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-red-400'];

type Answers = Record<string, number>;

function computeResults(answers: Answers) {
  const fields = Object.keys(QUIZ_QUESTIONS[0].field_weights);
  const scores: Record<string, number> = {};
  fields.forEach((f) => { scores[f] = 0; });

  QUIZ_QUESTIONS.forEach((q) => {
    const ans = answers[q.id] ?? 0;
    const weights = q.field_weights as Record<string, number>;
    Object.entries(weights).forEach(([field, weight]) => {
      scores[field] = (scores[field] ?? 0) + ans * weight;
    });
  });

  const maxPossible: Record<string, number> = {};
  QUIZ_QUESTIONS.forEach((q) => {
    const weights = q.field_weights as Record<string, number>;
    Object.entries(weights).forEach(([field, weight]) => {
      maxPossible[field] = (maxPossible[field] ?? 0) + 4 * weight;
    });
  });

  return Object.entries(scores)
    .map(([slug, score]) => ({
      slug,
      score: Math.round((score / (maxPossible[slug] || 1)) * 100),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export default function QuizPage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [results, setResults] = useState<{ slug: string; score: number }[] | null>(null);

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
      setResults(computeResults(answers));
    }
  }

  function prev() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  function reset() {
    setStarted(false);
    setCurrent(0);
    setAnswers({});
    setResults(null);
  }

  if (results) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Career Match Results</h1>
          <p className="mt-3 text-muted-foreground">Based on your {QUIZ_QUESTIONS.length} answers, here are your top field matches</p>
        </div>
        <div className="space-y-4">
          {results.map((r, i) => {
            const field = fieldMap[r.slug];
            if (!field) return null;
            return (
              <div key={r.slug} className={`relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-5 ${i === 0 ? 'ring-2 ring-primary' : ''}`}>
                {i === 0 && (
                  <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Best Match 🏆
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{field.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-semibold text-foreground">{field.name}</h2>
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                    </div>
                    <div className="progress-track mb-1.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${RESULT_COLORS[i % RESULT_COLORS.length]} transition-all duration-1000`}
                        style={{ width: `${r.score}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{field.category} · {field.difficultyLevel}</span>
                      <span className="font-semibold text-foreground">{r.score}% match</span>
                    </div>
                  </div>
                </div>
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
          Answer {QUIZ_QUESTIONS.length} questions across 8 categories to discover the academic fields that best match your interests, strengths, and personality.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 text-left">
          {[
            { emoji: '⏱️', label: '~10 minutes', desc: 'Quick and focused' },
            { emoji: '🎯', label: '8 categories', desc: 'Math, Coding, Biology, Business, Design, Communication, Research, Security' },
            { emoji: '📊', label: 'Top 5 fields', desc: 'Personalized compatibility scores' },
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
        <button onClick={() => setStarted(true)} className="btn-primary mt-8 text-base px-8 py-4">
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
