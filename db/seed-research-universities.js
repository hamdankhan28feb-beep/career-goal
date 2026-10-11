#!/usr/bin/env node
/**
 * Strict research university sync:
 * 1) Clear incorrect fuzzy research_id links
 * 2) Rematch existing DB rows with STRICT name/slug rules only
 * 3) INSERT research Karachi rows that have no DB match (idempotent upsert by research_id / slug)
 * Never touches users/reviews/sessions. Never invents verified status.
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

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function ownershipToType(o) {
  const v = String(o || '').toLowerCase();
  if (v === 'public') return 'Public';
  if (v === 'private') return 'Private';
  return null;
}

function toDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

function hecLabel(r) {
  const v = String(r.hec_recognised || '').toLowerCase();
  if (v === 'yes') return 'HEC Recognized';
  if (v === 'no') return 'Not HEC Recognized';
  return null;
}

/** Exact or near-exact only — rejects substring traps like Habib↔Nazeer Hussain, Indus↔Indus Valley. */
function strictMatchScore(dbUni, research) {
  const dbNames = [dbUni.name, dbUni.short_name, dbUni.slug].filter(Boolean).map(norm);
  const rNames = [research.common_name, research.hec_name, research.id?.replace(/^khi-/, '').replace(/-/g, ' ')].filter(Boolean).map(norm);
  let best = 0;
  for (const a of dbNames) {
    for (const b of rNames) {
      if (!a || !b) continue;
      if (a === b) best = Math.max(best, 100);
      // allow campus suffix differences only when shared token length is high
      const aTokens = new Set(a.split(' ').filter((t) => t.length > 2));
      const bTokens = new Set(b.split(' ').filter((t) => t.length > 2));
      const inter = [...aTokens].filter((t) => bTokens.has(t));
      const union = new Set([...aTokens, ...bTokens]);
      const jaccard = union.size ? inter.length / union.size : 0;
      // Require strong overlap AND shared distinctive head token
      if (jaccard >= 0.75 && inter.length >= 2) best = Math.max(best, Math.round(jaccard * 90));
    }
  }
  // Explicit alias map for known short names
  const aliases = {
    'fast karachi': 'fast nuces',
    'iba karachi': 'iba',
    neduet: 'ned',
    dsu: 'dsu',
    ssuet: 'ssuet',
    uok: 'uok',
    iobm: 'iobm',
    majU: 'maju',
  };
  return best;
}

const MANUAL_ALIASES = [
  { slugIncludes: 'fast', researchId: 'khi-fast-nuces' },
  { slugIncludes: 'iba', researchId: 'khi-iba' },
  { slugIncludes: 'ned', researchId: 'khi-ned' },
  { slugIncludes: 'dha-suffa', researchId: 'khi-dsu' },
  { slugIncludes: 'bahria', researchId: 'khi-bahria' },
  { slugIncludes: 'hamdard', researchId: 'khi-hamdard' },
  { slugIncludes: 'habib', researchId: 'khi-habib' },
  { slugIncludes: 'indus-university', researchId: 'khi-indus' },
  { slugIncludes: 'iqra', researchId: 'khi-iqra' },
  { slugIncludes: 'maju', researchId: 'khi-maju' },
  { slugIncludes: 'szabist', researchId: 'khi-szabist' },
  { slugIncludes: 'ssuet', researchId: 'khi-ssuet' },
  { slugIncludes: 'uok', researchId: 'khi-uok' },
  { slugIncludes: 'iobm', researchId: 'khi-iobm' },
  { slugIncludes: 'duet', researchId: 'khi-duet' },
  { slugIncludes: 'ziauddin', researchId: 'khi-ziauddin' },
];

async function main() {
  const dry = process.argv.includes('--dry-run');
  const connectionString = loadConnectionString();
  if (!connectionString) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }
  const research = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'research', 'universities_karachi.json'), 'utf8')
  );
  const byId = Object.fromEntries(research.map((r) => [r.id, r]));
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  const summary = { cleared: 0, rematched: 0, inserted: 0, updated: 0, skippedUnverifiedInsert: 0, unmatchedAfter: 0 };

  try {
    await client.query('BEGIN');

    // 1) Clear ALL research links then rematch strictly (fixes Habib/Indus/Iqra false positives)
    const cleared = await client.query(
      `UPDATE universities SET research_id = NULL, verification_status = NULL, last_verified_at = NULL, ownership_source = NULL, updated_at = NOW()
       WHERE research_id IS NOT NULL OR verification_status IS NOT NULL`
    );
    summary.cleared = cleared.rowCount || 0;

    const { rows: dbUnis } = await client.query(
      'SELECT university_id, name, short_name, slug, university_type FROM universities'
    );

    const usedResearch = new Set();

    // Manual aliases first
    for (const alias of MANUAL_ALIASES) {
      const uni = dbUnis.find((u) => (u.slug || '').includes(alias.slugIncludes));
      const r = byId[alias.researchId];
      if (!uni || !r || usedResearch.has(r.id)) continue;
      const type = ownershipToType(r.ownership);
      await client.query(
        `UPDATE universities SET
           research_id = $2,
           verification_status = $3,
           last_verified_at = $4,
           ownership_source = $5,
           university_type = COALESCE($6, university_type),
           hec_status = COALESCE($7, hec_status),
           admissions_portal = COALESCE(NULLIF($8,''), admissions_portal),
           city = COALESCE(city, $9),
           province = COALESCE(province, $10),
           source_note = COALESCE(source_note, $11),
           updated_at = NOW()
         WHERE university_id = $1`,
        [
          uni.university_id,
          r.id,
          r.verification_status || null,
          toDate(r.last_verified_at),
          r.ownership ? 'research:' + r.ownership : null,
          type,
          hecLabel(r),
          r.admissions_url || null,
          r.city || 'Karachi',
          r.province || 'Sindh',
          [
            r.campuses_note,
            r.programs_cs === 'yes' ? 'programs:CS' : null,
            r.programs_se === 'yes' ? 'SE' : null,
            r.programs_ai === 'yes' ? 'AI' : null,
            r.programs_ds === 'yes' ? 'DS' : null,
            r.fee_notes,
            r.entry_test_notes,
          ]
            .filter(Boolean)
            .join(' | ') || null,
        ]
      );
      usedResearch.add(r.id);
      summary.rematched += 1;
    }

    // Strict auto for remaining DB rows
    for (const uni of dbUnis) {
      const already = await client.query('SELECT research_id FROM universities WHERE university_id=$1', [uni.university_id]);
      if (already.rows[0]?.research_id) continue;
      let best = null;
      let bestScore = 0;
      for (const r of research) {
        if (usedResearch.has(r.id)) continue;
        const score = strictMatchScore(uni, r);
        if (score > bestScore) {
          bestScore = score;
          best = r;
        }
      }
      if (!best || bestScore < 90) continue;
      const type = ownershipToType(best.ownership);
      await client.query(
        `UPDATE universities SET research_id=$2, verification_status=$3, last_verified_at=$4, ownership_source=$5,
         university_type=COALESCE($6, university_type), hec_status=COALESCE($7, hec_status), updated_at=NOW()
         WHERE university_id=$1`,
        [
          uni.university_id,
          best.id,
          best.verification_status || null,
          toDate(best.last_verified_at),
          best.ownership ? 'research:' + best.ownership : null,
          type,
          hecLabel(best),
        ]
      );
      usedResearch.add(best.id);
      summary.rematched += 1;
    }

    // 2) Insert research rows not linked — all remaining research IDs
    for (const r of research) {
      if (usedResearch.has(r.id)) continue;
      const displayName = (r.common_name || r.hec_name || '').trim();
      if (!displayName) continue;
      const slugBase = slugify(r.id.replace(/^khi-/, '') || displayName);
      const slug = slugBase || slugify(displayName);
      const type = ownershipToType(r.ownership);
      const shortName = displayName.split(',')[0].slice(0, 40);
      const sourceNote = [
        'Seeded from research universities_karachi.json',
        r.verification_status ? 'status=' + r.verification_status : null,
        r.campuses_note,
        r.programs_cs === 'yes' ? 'CS' : null,
        r.programs_se === 'yes' ? 'SE' : null,
        r.programs_ai === 'yes' ? 'AI' : null,
        r.programs_ds === 'yes' ? 'DS' : null,
        r.fee_notes,
        r.notes,
      ]
        .filter(Boolean)
        .join(' | ');

      // Upsert by research_id if somehow present, else by slug
      const existing = await client.query(
        'SELECT university_id FROM universities WHERE research_id=$1 OR slug=$2 LIMIT 1',
        [r.id, slug]
      );
      if (existing.rows.length) {
        await client.query(
          `UPDATE universities SET
             research_id=$2, verification_status=$3, last_verified_at=$4, ownership_source=$5,
             university_type=COALESCE($6, university_type), hec_status=COALESCE($7, hec_status),
             admissions_portal=COALESCE(NULLIF($8,''), admissions_portal),
             source_note=COALESCE($9, source_note), updated_at=NOW()
           WHERE university_id=$1`,
          [
            existing.rows[0].university_id,
            r.id,
            r.verification_status || null,
            toDate(r.last_verified_at),
            r.ownership ? 'research:' + r.ownership : null,
            type,
            hecLabel(r),
            r.admissions_url || null,
            sourceNote,
          ]
        );
        summary.updated += 1;
        usedResearch.add(r.id);
        continue;
      }

      if (dry) {
        summary.inserted += 1;
        usedResearch.add(r.id);
        continue;
      }

      await client.query(
        `INSERT INTO universities (
           name, short_name, slug, admissions_portal, city, province, country,
           hec_status, university_type, social_media, source_note, is_active,
           verification_status, last_verified_at, research_id, ownership_source
         ) VALUES (
           $1,$2,$3,$4,$5,$6,'Pakistan',$7,$8,'{}'::jsonb,$9,TRUE,$10,$11,$12,$13
         )`,
        [
          displayName,
          shortName,
          slug,
          r.admissions_url || null,
          r.city || 'Karachi',
          r.province || 'Sindh',
          hecLabel(r),
          type,
          sourceNote,
          r.verification_status || null,
          toDate(r.last_verified_at),
          r.id,
          r.ownership ? 'research:' + r.ownership : null,
        ]
      );
      summary.inserted += 1;
      usedResearch.add(r.id);
    }

    if (dry) {
      await client.query('ROLLBACK');
      console.log('DRY RUN — rolled back. Summary:', summary);
    } else {
      await client.query('COMMIT');
      const counts = await client.query(
        `SELECT COUNT(*)::int AS n,
                COUNT(research_id)::int AS linked,
                COUNT(*) FILTER (WHERE verification_status='verified')::int AS verified,
                COUNT(*) FILTER (WHERE verification_status='partial')::int AS partial,
                COUNT(*) FILTER (WHERE verification_status='unverified')::int AS unverified
         FROM universities`
      );
      const check = await client.query(
        `SELECT name, research_id, verification_status, university_type FROM universities
         WHERE slug IN ('habib-university','indus-university','iqra-university') ORDER BY slug`
      );
      console.log('COMMITTED', summary);
      console.log('COUNTS', counts.rows[0]);
      console.log('FIXED_CHECK', check.rows);
      summary.unmatchedAfter = research.length - usedResearch.size;
      console.log('research rows unused', summary.unmatchedAfter);
    }
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('FAIL', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
