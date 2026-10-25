#!/usr/bin/env node
/**
 * One idempotent setup for a Postgres database (local or Neon).
 *
 *   DATABASE_URL=postgres://... npm run db:setup
 *
 * Applies schema_final.sql only when the universities table is missing,
 * then runs every db/migrations/*.sql file in order, then seeds universities,
 * Karachi research rows, scholarships, learning resources, all profile batches,
 * verification events, ratings and field conflicts.
 *
 * Does not DROP the database. Does not delete users, sessions, reviews,
 * verification events, ratings or conflict rows. Catalogue child rows for
 * universities in data_v2.json are replaced by db/seed.js so a re-run does
 * not duplicate fees, campuses and similar rows.
 *
 * The connection string is never printed.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Pool } = require('pg');

const root = path.join(__dirname, '..');

function loadConnectionString() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) return process.env.DATABASE_URL.trim();
  const envFile = path.join(root, '.env.local');
  if (fs.existsSync(envFile)) {
    const match = fs.readFileSync(envFile, 'utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (match) return match[1].replace(/^["']|["']$/g, '').trim();
  }
  return null;
}

function runNode(script, args = []) {
  console.log(`\n→ node ${path.relative(root, script)} ${args.join(' ')}`.trim());
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`Stopped: ${path.basename(script)} exited ${result.status}`);
    process.exit(result.status || 1);
  }
}

async function seedEvidence(client) {
  const ratings = JSON.parse(fs.readFileSync(path.join(root, 'data', 'research', 'ratings.json'), 'utf8')).ratings || [];
  let ratingInserted = 0;
  for (const r of ratings) {
    const res = await client.query(
      `INSERT INTO university_ratings
         (university_slug, kind, authority, year, label, value, source_url, source_title, last_verified_at, notes)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10
       WHERE NOT EXISTS (
         SELECT 1 FROM university_ratings
         WHERE university_slug = $1 AND kind = $2 AND authority = $3 AND year = $4
           AND label = $5 AND value = $6 AND source_url = $7
       )`,
      [
        r.university_slug,
        r.kind,
        r.authority,
        r.year,
        r.label,
        r.value,
        r.source_url,
        r.source_title || null,
        r.last_verified_at,
        r.notes || null,
      ],
    );
    ratingInserted += res.rowCount || 0;
  }

  const conflicts = JSON.parse(fs.readFileSync(path.join(root, 'data', 'research', 'field_conflicts.json'), 'utf8')).conflicts || [];
  let conflictInserted = 0;
  for (const c of conflicts) {
    const payload = JSON.stringify(c);
    const res = await client.query(
      `INSERT INTO field_conflicts (entity_type, entity_id, field_key, payload)
       SELECT $1, $2, $3, $4::jsonb
       WHERE NOT EXISTS (
         SELECT 1 FROM field_conflicts
         WHERE entity_type = $1 AND entity_id = $2 AND field_key = $3 AND payload = $4::jsonb
       )`,
      [c.entity_type, c.entity_id, c.field_key, payload],
    );
    conflictInserted += res.rowCount || 0;
  }
  console.log(`Evidence seed: ${ratingInserted} new rating row(s), ${conflictInserted} new conflict row(s). Existing rows kept.`);
}

async function main() {
  const connectionString = loadConnectionString();
  if (!connectionString) {
    console.error('DATABASE_URL is not set (checked the environment and .env.local).');
    process.exit(1);
  }
  process.env.DATABASE_URL = connectionString;

  const pool = new Pool({ connectionString, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  try {
    const exists = await client.query(`SELECT to_regclass('public.universities') AS universities`);
    if (!exists.rows[0].universities) {
      console.log('universities table is missing. Applying schema_final.sql.');
      const schema = fs.readFileSync(path.join(root, 'schema_final.sql'), 'utf8');
      await client.query(schema);
    } else {
      console.log('universities table already exists. Schema file skipped.');
    }

    const migrationsDir = path.join(root, 'db', 'migrations');
    const migrations = fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
    for (const name of migrations) {
      console.log(`Applying migration ${name}`);
      const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
      await client.query(sql);
    }
  } catch (err) {
    console.error('Schema or migration failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
    return;
  } finally {
    client.release();
    await pool.end();
  }
  if (process.exitCode) return;

  runNode(path.join(root, 'db', 'seed.js'));
  runNode(path.join(root, 'db', 'seed-research.js'));
  runNode(path.join(root, 'db', 'seed-research-universities.js'));
  runNode(path.join(root, 'db', 'seed-university-profiles.js'));
  runNode(path.join(root, 'scripts', 'record-verification.mjs'), ['--apply-db']);

  const pool2 = new Pool({ connectionString, connectionTimeoutMillis: 15000 });
  const client2 = await pool2.connect();
  try {
    await seedEvidence(client2);
    const counts = await client2.query(`
      SELECT
        (SELECT COUNT(*)::int FROM universities) AS universities,
        (SELECT COUNT(*)::int FROM universities WHERE profile_details IS NOT NULL) AS profiles,
        (SELECT COUNT(*)::int FROM research_scholarships) AS scholarships,
        (SELECT COUNT(*)::int FROM research_learning_resources) AS learning,
        (SELECT COUNT(*)::int FROM verification_events) AS verification_events,
        (SELECT COUNT(*)::int FROM university_ratings) AS ratings,
        (SELECT COUNT(*)::int FROM field_conflicts) AS conflicts,
        (SELECT COUNT(*)::int FROM reviews) AS reviews,
        (SELECT COUNT(*)::int FROM users) AS users
    `);
    console.log('Setup counts:', JSON.stringify(counts.rows[0]));
  } catch (err) {
    console.error('Evidence seed failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    client2.release();
    await pool2.end();
  }
}

main();
