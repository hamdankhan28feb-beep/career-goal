// API validation for the report route. Does not write to a database.
// Run: node scripts/api-validation.mjs
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { POST } from '../src/app/api/reports/route.ts';

let n = 0;
const t = async (name, fn) => { await fn(); n++; console.log('PASS', name); };

function post(body, raw = false) {
  return POST(new NextRequest('http://localhost/api/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ? body : JSON.stringify(body),
  }));
}

delete process.env.DATABASE_URL;

await t('invalid JSON is rejected', async () => {
  const res = await post('{', true);
  assert.equal(res.status, 400);
});
await t('a short message is rejected before any database call', async () => {
  const res = await post({ message: 'too short' });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /12 to 4000/);
});
await t('a bad email is rejected', async () => {
  const res = await post({ message: 'This figure does not match the prospectus.', contact_email: 'not-an-email' });
  assert.equal(res.status, 400);
});
await t('a valid report is not saved when DATABASE_URL is unset', async () => {
  const res = await post({ message: 'The fee on this page does not match the official schedule.', page_path: '/universities/fast-nuces-karachi' });
  assert.equal(res.status, 503);
  const json = await res.json();
  assert.match(json.error, /cannot be saved/i);
});

console.log(`\n${n} API validation checks passed`);
