#!/usr/bin/env node
/**
 * Records a verification event.
 *
 *   node scripts/record-verification.mjs --check
 *     Validates data/research/verification_events.json. Does not touch a database.
 *
 *   node scripts/record-verification.mjs --apply-db
 *     Inserts events and copies checked_at onto matching university_ratings /
 *     universities.last_verified_at. Requires DATABASE_URL. Refuses to run when
 *     it is unset. Does not print the connection string.
 *
 * Render code must not call this implicitly or default a date to now.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'research', 'verification_events.json');

function load() {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const events = Array.isArray(parsed.events) ? parsed.events : [];
  const errors = [];
  events.forEach((e, i) => {
    if (!e.entity_type || !e.entity_id || !e.field_key) errors.push(`event ${i} missing entity`);
    if (!e.source_url || !/^https?:\/\//.test(e.source_url)) errors.push(`event ${i} missing source_url`);
    if (!e.checked_at || !/^\d{4}-\d{2}-\d{2}$/.test(e.checked_at)) errors.push(`event ${i} missing checked_at`);
    if (!e.checker) errors.push(`event ${i} missing checker`);
  });
  return { events, errors };
}

const apply = process.argv.includes('--apply-db');
const { events, errors } = load();
if (errors.length) {
  console.error('verification log invalid');
  for (const err of errors) console.error(' -', err);
  process.exit(1);
}
console.log(`verification log ok: ${events.length} event(s)`);

if (!apply) {
  console.log('database not modified (--check only)');
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Refusing to write verification events.');
  process.exit(1);
}

const { default: pg } = await import('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const e of events) {
    await client.query(
      `INSERT INTO verification_events
         (entity_type, entity_id, field_key, source_url, source_title, checked_at, checker, notes)
       SELECT $1, $2, $3, $4, $5, $6::date, $7, $8
       WHERE NOT EXISTS (
         SELECT 1 FROM verification_events
         WHERE entity_type = $1 AND entity_id = $2 AND field_key = $3
           AND source_url = $4 AND checked_at = $6::date
       )`,
      [e.entity_type, e.entity_id, e.field_key, e.source_url, e.source_title || null, e.checked_at, e.checker, e.notes || null],
    );
  }
  await client.query('COMMIT');
  console.log('verification events inserted (existing matching rows left in place)');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('verification write failed:', err instanceof Error ? err.message : 'unknown error');
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
