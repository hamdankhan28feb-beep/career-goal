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
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
// gemini-2.0-flash shut down on 2026-06-01. This id is on the free Gemini API tier
// and is the model Google points new projects at (checked 2026-10-25).
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/** Runtime lookup. Direct `process.env.NAME` reads are inlined at build time. */
function envValue(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function openAiModel(): string {
  return envValue('OPENAI_MODEL') || DEFAULT_OPENAI_MODEL;
}

function geminiModel(): string {
  return envValue('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL;
}

function configuredProviders(): Array<'openai' | 'gemini'> {
  const list: Array<'openai' | 'gemini'> = [];
  if (envValue('OPENAI_API_KEY')) list.push('openai');
  if (envValue('GEMINI_API_KEY')) list.push('gemini');
  const preferred = (envValue('COUNSELOR_PROVIDER') || '').toLowerCase();
  if (preferred === 'gemini' && list.length === 2) list.reverse();
  if (preferred === 'openai' && list.length === 2 && list[0] !== 'openai') list.reverse();
  return list;
}

function unconfigured() {
  console.info('AI Counselor unavailable: no provider key is configured.');
  return NextResponse.json(
    {
      error:
        'The AI Counselor is not configured. Set GEMINI_API_KEY (a free key from Google AI Studio) or OPENAI_API_KEY on the server, then redeploy. No answer was generated.',
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
      Authorization: `Bearer ${envValue('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({
      model: openAiModel(),
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

function geminiContents(messages: ChatMessage[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const message of messages) {
    const role = message.role === 'assistant' ? 'model' : 'user';
    const previous = contents[contents.length - 1];
    if (previous && previous.role === role) {
      previous.parts[0].text = `${previous.parts[0].text}\n${message.content}`;
    } else {
      contents.push({ role, parts: [{ text: message.content }] });
    }
  }
  return contents;
}

async function callGemini(system: string, messages: ChatMessage[]): Promise<string> {
  const model = geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': envValue('GEMINI_API_KEY') as string,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: geminiContents(messages),
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const status = res.status === 404 ? 502 : res.status;
    const hint =
      res.status === 404
        ? ` Gemini model "${model}" was not found. Set GEMINI_MODEL to a current free model such as ${DEFAULT_GEMINI_MODEL}.`
        : '';
    throw new UpstreamError(`Gemini ${res.status}: ${detail.slice(0, 300)}${hint}`, status);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? '')
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

  const status = lastError instanceof UpstreamError && (lastError.status === 429 || lastError.status === 400) ? lastError.status : 502;
  const detail = lastError instanceof UpstreamError ? lastError.message : '';
  const modelMissing = /was not found/.test(detail);
  return NextResponse.json(
    {
      error: modelMissing
        ? detail
        : status === 429
          ? 'The AI provider is rate-limiting requests. Please try again in a minute. No answer was generated.'
          : 'The AI provider could not answer right now. No answer was generated.',
      mode: 'error',
    },
    { status: modelMissing ? 502 : status }
  );
}
