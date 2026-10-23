#!/usr/bin/env node
/**
 * Detailed university profile sync (Batch 1+).
 * - Applies migration 004 (idempotent ALTER ... IF NOT EXISTS).
 * - Upserts profile_details / profile_status / profile_checked_at keyed by research_id, falling back to slug.
 * - Fills address only when the DB value is NULL. Never changes verification_status, users, reviews or sessions.
 * Usage: node db/seed-university-profiles.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const match = fs.readFileSync(envFile, 'utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (match) return match[1].replace(/^["']|["']$/g, '');
  }
  return null;
}

const PROFILE_FILES = [
  'university_profiles_batch1.json',
  'university_profiles_batch2.json',
  'university_profiles_batch3.json',
  'university_profiles_batch4.json',
  'university_profiles_batch5.json',
];

function firstValue(fields, labels) {
  for (const l of labels) {
    const f = fields.find((x) => x.label === l && x.value && x.status !== 'unavailable');
    if (f) return f.value;
  }
  return null;
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const cs = loadConnectionString();
  if (!cs) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }
  const profiles = PROFILE_FILES.flatMap((f) =>
    JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'research', f), 'utf8')).profiles
  );
  const migration = fs.readFileSync(path.join(__dirname, 'migrations', '004_university_profiles.sql'), 'utf8');
  const pool = new Pool({ connectionString: cs, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  const summary = { updated: 0, notFound: [] };
  try {
    await client.query(migration);
    await client.query('BEGIN');
    for (const p of profiles) {
      const address = firstValue(p.sections.overview, ['Main campus address', 'Campus address']);
      const res = await client.query(
        `UPDATE universities SET
           profile_details = $3::jsonb,
           profile_status = $4,
           profile_checked_at = $5,
           address = COALESCE(address, $6),
           updated_at = NOW()
         WHERE university_id = (
           SELECT university_id FROM universities
           WHERE research_id = $1 OR slug = $2
           ORDER BY (research_id = $1) DESC NULLS LAST
           LIMIT 1
         )
         RETURNING slug, research_id, verification_status, profile_status`,
        [p.research_id, p.slug, JSON.stringify(p), null, null, address]
      );
      if (res.rowCount) {
        summary.updated += 1;
        console.log('upserted', res.rows[0]);
      } else {
        summary.notFound.push(p.slug);
      }
    }
    if (dry) {
      await client.query('ROLLBACK');
      console.log('DRY RUN - rolled back', summary);
    } else {
      await client.query('COMMIT');
      console.log('COMMITTED', summary);
    }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('FAIL', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
