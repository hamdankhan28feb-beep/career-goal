#!/usr/bin/env node
/**
 * Idempotent research seed: verification/ownership onto universities +
 * research_scholarships + research_learning_resources from data/research/*.json
 * Does NOT touch users/reviews/sessions.
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

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'research', name), 'utf8'));
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function ownershipToType(o) {
  const v = String(o || '').toLowerCase();
  if (v === 'public') return 'Public';
  if (v === 'private') return 'Private';
  return null;
}

function toDate() {
  // Hand-typed research dates are not verification events.
  return null;
}

async function main() {
  const connectionString = loadConnectionString();
  if (!connectionString) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }
  const unis = loadJson('universities_karachi.json');
  const scholarships = loadJson('scholarships.json');
  const learning = loadJson('learning_resources.json');
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  let updatedUnis = 0;
  let unmatched = 0;
  try {
    await client.query('BEGIN');

    const { rows: dbUnis } = await client.query(
      'SELECT university_id, name, short_name, slug, university_type FROM universities'
    );

    for (const r of unis) {
      const candidates = [r.common_name, r.hec_name].filter(Boolean).map(norm);
      let hit = null;
      let best = 0;
      for (const u of dbUnis) {
        const names = [u.name, u.short_name].filter(Boolean).map(norm);
        for (const c of candidates) {
          for (const n of names) {
            if (!c || !n) continue;
            if (c === n || n.includes(c) || c.includes(n)) {
              const score = Math.min(c.length, n.length);
              if (score > best) {
                best = score;
                hit = u;
              }
            }
          }
        }
      }
      if (!hit) {
        unmatched += 1;
        continue;
      }
      const type = ownershipToType(r.ownership);
      await client.query(
        'UPDATE universities SET verification_status = $2, last_verified_at = $3, research_id = $4, ownership_source = $5, university_type = COALESCE($6, university_type), updated_at = NOW() WHERE university_id = $1',
        [
          hit.university_id,
          null,
          toDate(r.last_verified_at),
          r.id || null,
          r.ownership ? 'research_csv:' + String(r.ownership) : null,
          type,
        ]
      );
      updatedUnis += 1;
    }

    for (const s of scholarships) {
      const id = s.id || norm(s.name).replace(/\s+/g, '-');
      await client.query(
        `INSERT INTO research_scholarships (
           id, name, provider, provider_type, status,
           academic_eligibility, financial_eligibility, award_coverage, deadline,
           application_url, source_url, eligible_levels, eligible_locations,
           eligible_universities, renewal_notes, documents_required, notes,
           missing_fields, last_verified_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,COALESCE(NULLIF($5,''),'unknown'),
           $6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW()
         )
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           provider = EXCLUDED.provider,
           provider_type = EXCLUDED.provider_type,
           status = EXCLUDED.status,
           academic_eligibility = EXCLUDED.academic_eligibility,
           financial_eligibility = EXCLUDED.financial_eligibility,
           award_coverage = EXCLUDED.award_coverage,
           deadline = EXCLUDED.deadline,
           application_url = EXCLUDED.application_url,
           source_url = EXCLUDED.source_url,
           eligible_levels = EXCLUDED.eligible_levels,
           eligible_locations = EXCLUDED.eligible_locations,
           eligible_universities = EXCLUDED.eligible_universities,
           renewal_notes = EXCLUDED.renewal_notes,
           documents_required = EXCLUDED.documents_required,
           notes = EXCLUDED.notes,
           missing_fields = EXCLUDED.missing_fields,
           last_verified_at = EXCLUDED.last_verified_at,
           updated_at = NOW()`,
        [
          id,
          s.name || 'Unnamed',
          s.provider || null,
          s.provider_type || null,
          String(s.status || 'unknown').toLowerCase(),
          s.academic_eligibility || null,
          s.financial_eligibility || null,
          s.award_coverage || null,
          s.deadline || null,
          s.application_url || null,
          s.source_url || null,
          s.eligible_levels || null,
          s.eligible_locations || null,
          s.eligible_universities || null,
          s.renewal_notes || null,
          s.documents_required || null,
          s.notes || null,
          s.missing_fields || null,
          toDate(s.last_verified_at),
        ]
      );
    }

    let learningOk = 0;
    for (const L of learning) {
      const id = L.id || norm(L.title || L.name || L.url).replace(/\s+/g, '-');
      const url = L.url || L.link || '';
      if (!url) continue;
      await client.query(
        `INSERT INTO research_learning_resources (
           id, title, url, provider, topic, level, cost, language, notes, last_verified_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           url = EXCLUDED.url,
           provider = EXCLUDED.provider,
           topic = EXCLUDED.topic,
           level = EXCLUDED.level,
           cost = EXCLUDED.cost,
           language = EXCLUDED.language,
           notes = EXCLUDED.notes,
           last_verified_at = EXCLUDED.last_verified_at,
           updated_at = NOW()`,
        [
          id,
          L.title || L.name || 'Resource',
          url,
          L.provider || null,
          L.topic || L.category || null,
          L.level || null,
          L.cost || null,
          L.language || null,
          L.notes || null,
          toDate(L.last_verified_at),
        ]
      );
      learningOk += 1;
    }

    await client.query('COMMIT');
    const sc = await client.query('SELECT status, COUNT(*)::int AS n FROM research_scholarships GROUP BY status ORDER BY 1');
    const vc = await client.query(
      'SELECT verification_status, COUNT(*)::int AS n FROM universities GROUP BY verification_status ORDER BY 1'
    );
    const lc = await client.query('SELECT COUNT(*)::int AS n FROM research_learning_resources');
    console.log('Research seed committed.');
    console.log('Universities matched/updated:', updatedUnis, 'unmatched research rows:', unmatched);
    console.log('Verification counts:', JSON.stringify(vc.rows));
    console.log('Scholarship status counts:', JSON.stringify(sc.rows));
    console.log('Learning resources seeded:', learningOk, 'table count', lc.rows[0].n);
    console.log('JSON totals: unis', unis.length, 'scholarships', scholarships.length, 'learning', learning.length);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('SEED FAIL', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
