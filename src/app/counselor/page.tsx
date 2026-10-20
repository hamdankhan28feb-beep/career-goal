'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  BookOpen,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Send,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';

import { CitationChip, SourceDrawer, type SourceCitation } from '@/components/source-drawer';

type Mode = 'checking' | 'live' | 'unconfigured' | 'error';

type ApiCitation = SourceCitation & { ref: string; cited?: boolean; sourceId?: string };

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'notice';
  content: string;
  citations?: ApiCitation[];
  uncited?: boolean;
  noticeKind?: 'unconfigured' | 'error';
};

const QUICK_PROMPTS = [
  'Which Karachi universities offer BS Artificial Intelligence?',
  'What need-based scholarships exist for public universities?',
  'Free resources to start learning Python and web development',
  'How should I compare FAST, NED and IBA for computer science?',
  'Is the HEC Need Based Scholarship open right now?',
  'Mujhe software engineering ke liye kaun si university choose karni chahiye?',
];

/**
 * Example answers — illustrate the *style* of a grounded answer only.
 * Hidden by default; never shown as a live reply; contain no fees, deadlines or merit numbers.
 */
const EXAMPLE_ANSWERS: Array<{ q: string; a: string }> = [
  {
    q: 'Is the HEC Need Based Scholarship open right now?',
    a: 'A live answer would check the scholarship record first. If its status is "Unknown", the counselor says it could not confirm an open window, links the official HEC page [S1], and suggests contacting your university\'s financial aid office. It never invents a deadline.',
  },
  {
    q: 'Which Karachi universities offer BS AI?',
    a: 'A live answer lists only universities whose research record shows a BS AI programme, cites each one ([S1], [S2] …), and notes when a record is only partially verified.',
  },
  {
    q: 'What will my fee be at a private university?',
    a: 'If FuturePath has no verified fee for that university, a live answer says so plainly and points to the official fee page instead of estimating a number.',
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Renders [S1]-style markers as small superscript chips that open the source drawer. */
function AnswerText({
  text,
  citations,
  onOpen,
}: {
  text: string;
  citations: ApiCitation[];
  onOpen: (c: SourceCitation) => void;
}) {
  const byRef = new Map(citations.map((c) => [c.ref, c]));
  const parts = text.split(/(\[S\d+\])/g);
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, i) => {
        const m = part.match(/^\[(S\d+)\]$/);
        const c = m ? byRef.get(m[1]) : undefined;
        if (m && c) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onOpen(c)}
              className="mx-0.5 inline-flex -translate-y-0.5 items-center rounded-md border border-primary/40 bg-primary/10 px-1 text-2xs font-semibold text-primary hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Source ${c.ref}: ${c.title}`}
            >
              {c.ref}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export default function CounselorPage() {
  const [mode, setMode] = useState<Mode>('checking');
  const [provider, setProvider] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [drawer, setDrawer] = useState<SourceCitation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/counselor', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { mode?: string; provider?: string | null }) => {
        if (cancelled) return;
        setMode(d.mode === 'live' ? 'live' : 'unconfigured');
        setProvider(d.provider ?? null);
      })
      .catch(() => {
        if (!cancelled) setMode('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        mode?: string;
        citations?: ApiCitation[];
        validation?: { uncited?: boolean };
      };

      if (res.status === 503 || data.mode === 'unconfigured') {
        setMode('unconfigured');
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'notice',
            noticeKind: 'unconfigured',
            content:
              'No answer was generated. The counselor is unavailable.',
          },
        ]);
        return;
      }
      if (!res.ok || !data.reply) {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'notice',
            noticeKind: 'error',
            content: data.error || 'Something went wrong. No answer was generated — please try again.',
          },
        ]);
        return;
      }
      setMode('live');
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          content: data.reply as string,
          citations: data.citations ?? [],
          uncited: !!data.validation?.uncited,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'notice',
          noticeKind: 'error',
          content: 'Network error. No answer was generated — please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const disabled = sending || mode === 'unconfigured' || mode === 'checking';

  return (
    <div className="mx-auto flex max-w-4xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
          <Bot className="h-3.5 w-3.5" aria-hidden /> Unavailable / Beta
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">AI Counselor</h1>
        <p className="mt-2 text-muted-foreground">
          Answers, when available, are not official advice. They may cite only records that have a source URL. Fees, deadlines and merit stay unstated when the sources do not contain them.
        </p>
      </header>

      {mode === 'unconfigured' ? (
        <div role="status" className="notice-warning mb-6 flex gap-3 p-5 text-sm">
          <Settings className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-medium text-foreground">Unavailable</p>
            <p className="mt-1 text-muted-foreground">
              The counselor cannot answer right now, and it will not invent one. University and scholarship pages remain available.
            </p>
          </div>
        </div>
      ) : mode === 'live' ? (
        <div className="notice-success mb-6 flex flex-wrap items-center gap-2 px-4 py-3 text-xs">
          <Sparkles className="h-4 w-4" aria-hidden />
          Beta{provider ? ` (${provider})` : ''}. Not official advice. Tap a marker like{' '}
          <span className="rounded-md border border-primary/40 bg-primary/10 px-1 font-semibold text-primary">S1</span> to see it.
        </div>
      ) : mode === 'error' ? (
        <div role="alert" className="notice-danger mb-6 p-4 text-sm">
          Couldn&rsquo;t reach the counselor service. Please refresh the page.
        </div>
      ) : null}

      <section
        aria-label="Conversation"
        aria-live="polite"
        className="min-h-[240px] max-h-[60svh] space-y-4 overflow-y-auto overscroll-contain rounded-3xl border border-border/70 bg-card/80 p-4 [overflow-wrap:anywhere] sm:min-h-[320px] sm:p-6"
        data-testid="counselor-conversation"
      >
        {messages.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Bot className="mx-auto mb-3 h-8 w-8" aria-hidden />
            Try one of these questions:
          </div>
        ) : null}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end gap-2">
              <div className="max-w-[85%] rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {m.content}
              </div>
              <User className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          ) : m.role === 'assistant' ? (
            <div key={m.id} className="flex gap-2">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="max-w-[85%] rounded-3xl rounded-bl-md border border-border/70 bg-background px-4 py-3">
                <AnswerText text={m.content} citations={m.citations ?? []} onOpen={setDrawer} />
                {m.uncited ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    This answer did not cite a source — treat it as general guidance only.
                  </p>
                ) : null}
                {m.citations && m.citations.length ? (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden /> Sources retrieved
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.citations.map((c) => (
                        <CitationChip key={c.ref} citation={c} onOpen={setDrawer} dimmed={!c.cited} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No matching FuturePath sources were found for this question.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              role="status"
              className={`flex gap-2 rounded-2xl border px-4 py-3 text-sm ${
                m.noticeKind === 'unconfigured'
                  ? 'border-warning/30 bg-warning/10'
                  : 'border-destructive/30 bg-destructive/10'
              }`}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {m.content}
            </div>
          )
        )}

        {sending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching sources and drafting an answer…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => send(p)}
            className="min-h-10 lg:min-h-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        className="sticky bottom-0 z-20 -mx-4 mt-4 flex gap-2 border-t border-border/50 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:mx-0 sm:px-0"
        data-testid="counselor-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="counselor-input" className="sr-only">
          Your question
        </label>
        <input
          id="counselor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          maxLength={2000}
          placeholder={
            mode === 'unconfigured' ? 'Unavailable' : 'Ask about a university or scholarship…'
          }
          className="input-field flex-1"
        />
        <button type="submit" disabled={disabled || !input.trim()} className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          Send
        </button>
      </form>

      <section className="mt-8">
        <button
          type="button"
          aria-expanded={showExamples}
          aria-controls="counselor-examples"
          onClick={() => setShowExamples((v) => !v)}
          className="inline-flex min-h-10 lg:min-h-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          {showExamples ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          {showExamples ? 'Hide example answers' : 'Show example answers'}
        </button>
        {showExamples ? (
          <div id="counselor-examples" className="mt-3 space-y-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Examples only — these illustrate how a grounded answer behaves. They are not live answers and contain no
              verified facts.
            </p>
            {EXAMPLE_ANSWERS.map((ex) => (
              <div key={ex.q} className="rounded-3xl border border-dashed border-border p-4 text-sm">
                <div className="font-medium text-foreground">Q: {ex.q}</div>
                <div className="mt-1.5 text-muted-foreground">
                  <span className="mr-1.5 rounded-full border border-border px-2 py-0.5 text-2xs uppercase tracking-wide">
                    Example
                  </span>
                  {ex.a}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <SourceDrawer open={!!drawer} citation={drawer} onClose={closeDrawer} />
    </div>
  );
}
