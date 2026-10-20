import { NextRequest, NextResponse } from 'next/server';

import {
  formatCitationsForPrompt,
  publicCitations,
  retrieveResearchSnippets,
} from '@/lib/counselor-retrieve';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };

const MAX_TURNS = 8;
const MAX_CHARS = 2000;

// Model names are configurable; defaults can be overridden in .env.local without code changes.
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function configuredProviders(): Array<'openai' | 'gemini'> {
  const list: Array<'openai' | 'gemini'> = [];
  if (process.env.OPENAI_API_KEY) list.push('openai');
  if (process.env.GEMINI_API_KEY) list.push('gemini');
  const preferred = (process.env.COUNSELOR_PROVIDER || '').toLowerCase();
  if (preferred === 'gemini' && list.length === 2) list.reverse();
  return list;
}

function unconfigured() {
  console.info('AI Counselor unavailable: no provider key is configured.');
  return NextResponse.json(
    {
      error: 'The AI Counselor is unavailable.',
      mode: 'unconfigured',
    },
    { status: 503 }
  );
}

/** Lightweight status probe for the counselor page (never exposes keys). */
export async function GET() {
  const providers = configuredProviders();
  return NextResponse.json({
    mode: providers.length ? 'live' : 'unconfigured',
    provider: providers[0] ?? null,
    availability: providers.length ? 'beta' : 'unavailable',
  });
}

function normalizeMessages(body: unknown): ChatMessage[] {
  const b = (body ?? {}) as { messages?: unknown; message?: unknown; history?: unknown };
  const out: ChatMessage[] = [];
  const pushAll = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const m of arr) {
      const mm = m as { role?: unknown; content?: unknown; text?: unknown };
      const role = mm.role === 'assistant' || mm.role === 'bot' ? 'assistant' : mm.role === 'user' ? 'user' : null;
      const content = typeof mm.content === 'string' ? mm.content : typeof mm.text === 'string' ? mm.text : '';
      if (role && content.trim()) out.push({ role, content: content.slice(0, MAX_CHARS) });
    }
  };
  pushAll(b.messages);
  if (!out.length) {
    pushAll(b.history);
    if (typeof b.message === 'string' && b.message.trim()) {
      out.push({ role: 'user', content: b.message.slice(0, MAX_CHARS) });
    }
  }
  return out.slice(-MAX_TURNS);
}

function buildSystemPrompt(sources: string): string {
  return `You are the FuturePath counselor, helping students in Pakistan (mainly Karachi) choose universities, scholarships and learning resources.

GROUNDING RULES (mandatory):
1. Use ONLY the SOURCES below for any factual claim about a specific university, programme, fee, test, deadline, scholarship or course. General study advice is fine without a source.
2. Cite every sourced fact inline with its marker, e.g. "IBA offers BS Computer Science [S1]". Use only markers that appear in SOURCES. Never invent a marker, URL, fee, deadline, merit cut-off, percentage or seat count.
3. If the SOURCES do not contain the answer, say clearly that FuturePath's verified data does not cover it yet, and suggest checking the official university/HEC website. Do not guess.
4. Scholarship statuses: only say a scholarship is "open" or "accepting applications" if its source Status is ACTIVE. UNKNOWN means no current dated window was found; CLOSED means the last window ended.
5. Universities with row status "partial" or "unverified" have incomplete data — say so when relying on them. A verification status applies to the matched dataset row, not a guarantee about everything at that university.
6. Be concise (under ~200 words unless asked), friendly, and practical. If the user writes in Roman Urdu, reply in Roman Urdu.
7. End with a short "Sources:" line listing the markers you used.
8. Say that the answer is not official advice. Never fabricate a citation, fee, deadline, merit figure or scholarship status.
9. If a source has no URL, do not treat it as verified.

SOURCES:
${sources}`;
}

class UpstreamError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callOpenAI(system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      max_tokens: 700,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new UpstreamError(`OpenAI ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new UpstreamError('OpenAI returned an empty answer', 502);
  return text;
}

async function callGemini(system: string, messages: ChatMessage[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY as string,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new UpstreamError(`Gemini ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();
  if (!text) throw new UpstreamError('Gemini returned an empty answer', 502);
  return text;
}

export async function POST(req: NextRequest) {
  const providers = configuredProviders();
  if (!providers.length) return unconfigured();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const messages = normalizeMessages(body);
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return NextResponse.json({ error: 'Send at least one user message.' }, { status: 400 });
  }
  // conversation must start with a user turn for both providers
  while (messages.length && messages[0].role !== 'user') messages.shift();

  // Retrieve with the latest question, plus the previous user turn for follow-ups ("what about fees there?")
  const prevUser = messages.filter((m) => m.role === 'user').slice(-2, -1)[0];
  const retrievalQuery = prevUser ? `${lastUser.content}\n${prevUser.content}` : lastUser.content;
  const citations = retrieveResearchSnippets(retrievalQuery, { limit: 6 });
  const system = buildSystemPrompt(formatCitationsForPrompt(citations));

  let lastError: unknown = null;
  for (const provider of providers) {
    try {
      const reply =
        provider === 'openai' ? await callOpenAI(system, messages) : await callGemini(system, messages);

      const validRefs = new Set(citations.map((c) => c.ref));
      const usedRefs = Array.from(new Set(Array.from(reply.matchAll(/\[(S\d+)\]/g), (m) => m[1])));
      const invalidRefs = usedRefs.filter((r) => !validRefs.has(r));

      return NextResponse.json({
        mode: 'live',
        provider,
        reply,
        citations: publicCitations(citations).map((c) => ({ ...c, cited: usedRefs.includes(c.ref) })),
        validation: {
          sourcesRetrieved: citations.length,
          cited: usedRefs.filter((r) => validRefs.has(r)),
          invalidRefs,
          uncited: citations.length > 0 && usedRefs.length === 0,
        },
      });
    } catch (err) {
      lastError = err;
      console.error(`[counselor] ${provider} failed:`, err instanceof Error ? err.message : err);
    }
  }

  const status = lastError instanceof UpstreamError && lastError.status === 429 ? 429 : 502;
  return NextResponse.json(
    {
      error:
        status === 429
          ? 'The AI provider is rate-limiting requests. Please try again in a minute.'
          : 'The AI provider could not answer right now. No answer was generated.',
      mode: 'error',
    },
    { status }
  );
}
