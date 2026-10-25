// Counselor provider selection. Does not call a live model.
// Run: node scripts/counselor-unit.mjs
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { GET, POST } from '../src/app/api/counselor/route.ts';

let n = 0;
const t = async (name, fn) => { await fn(); n++; console.log('PASS', name); };

const saved = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  COUNSELOR_PROVIDER: process.env.COUNSELOR_PROVIDER,
};

function clearKeys() {
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_MODEL;
  delete process.env.OPENAI_MODEL;
  delete process.env.COUNSELOR_PROVIDER;
}

function post(body) {
  return POST(new NextRequest('http://localhost/api/counselor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

const originalFetch = globalThis.fetch;

try {
  clearKeys();

  await t('no key returns 503 and names the env vars', async () => {
    const res = await post({ message: 'Which universities teach computer science in Karachi?' });
    assert.equal(res.status, 503);
    const json = await res.json();
    assert.equal(json.mode, 'unconfigured');
    assert.match(json.error, /GEMINI_API_KEY/);
    assert.match(json.error, /OPENAI_API_KEY/);
    assert.match(json.error, /No answer was generated/);
  });

  await t('status probe is unconfigured when no key is set', async () => {
    const res = await GET();
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.mode, 'unconfigured');
    assert.equal(json.provider, null);
  });

  await t('a Gemini key calls the current free model and skips thought text', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    let requestedUrl = '';
    let requestedModelHeader = '';
    globalThis.fetch = async (url, init) => {
      requestedUrl = String(url);
      requestedModelHeader = init.headers['x-goog-api-key'];
      const body = JSON.parse(init.body);
      assert.equal(body.systemInstruction.parts[0].text.includes('SOURCES'), true);
      assert.equal(body.contents[0].role, 'user');
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [
              { thought: true, text: 'hidden reasoning' },
              { text: 'IBA teaches BS Computer Science [S1]. This is not official advice.' },
            ],
          },
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    const res = await post({ message: 'Does IBA teach computer science?' });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.mode, 'live');
    assert.equal(json.provider, 'gemini');
    assert.match(json.reply, /IBA teaches BS Computer Science/);
    assert.doesNotMatch(json.reply, /hidden reasoning/);
    assert.match(requestedUrl, /\/models\/gemini-3\.5-flash-lite:generateContent$/);
    assert.doesNotMatch(requestedUrl, /gemini-2\.0-flash/);
    assert.equal(requestedModelHeader, 'test-gemini-key');
  });

  await t('a retired Gemini model name fails with JSON, not a crash', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'model gone' } }), { status: 404 });
    const res = await post({ message: 'Does IBA teach computer science?' });
    assert.equal(res.status, 502);
    const json = await res.json();
    assert.equal(json.mode, 'error');
    assert.match(json.error, /gemini-2\.0-flash/);
    assert.match(json.error, /GEMINI_MODEL/);
    assert.match(json.error, /gemini-3\.5-flash-lite/);
  });

  await t('an upstream network error returns JSON', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    delete process.env.GEMINI_MODEL;
    globalThis.fetch = async () => { throw new Error('socket hang up'); };
    const res = await post({ message: 'Does IBA teach computer science?' });
    assert.equal(res.status, 502);
    const json = await res.json();
    assert.match(json.error, /No answer was generated/);
  });
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

console.log(`\n${n} counselor checks passed`);
