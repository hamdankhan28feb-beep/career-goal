#!/usr/bin/env node
// =============================================================================
// db/seed.js — Seed the Career Goals database from data_v2.json
//
// Reads every university record from data_v2.json (the bundled source of truth)
// and writes it into the Postgres database defined by DATABASE_URL (.env.local
// is used when the variable is not already set).
//
// IDEMPOTENT — safe to re-run any number of times:
//   * universities are upserted by unique `slug`
//   * every child table is delete-then-inserted per university, so re-runs
//     never create duplicates
//   * everything runs inside a single transaction (all-or-nothing)
//
// Deliberately does NOT touch:
//   * `reviews`        — community content, never wiped by a seed
//   * `departments`    — not represented in data_v2.json
//   * `rankings`       — the source has no ranking_year; per project policy we
//                        never fabricate a year, so ranking rows are skipped
//
// Usage:
//   node db/seed.js
// =============================================================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ---- Connection -------------------------------------------------------------

function loadConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const match = fs.readFileSync(envFile, 'utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (match) return match[1].replace(/^["']|["']$/g, '');
  }
  return null;
}

const connectionString = loadConnectionString();
if (!connectionString) {
  console.error('DATABASE_URL is not set (checked environment and .env.local). Cannot seed.');
  process.exit(1);
}

// ---- Value coercion helpers -------------------------------------------------
// Follow the project's source policy: missing values -> NULL, never fabricate.

const toText = (v) => (v === undefined || v === null || v === '' ? null : String(v));
const toNum = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const toArr = (v) => (Array.isArray(v) && v.length ? v : []);
const toJsonObj = (v) => (v ? JSON.stringify(v) : '{}');
const toDate = (v) => {
  // Only ISO-ish dates are stored; descriptive text (e.g. "Fall 2026: window ran
  // through late June 2026") stays in admission_cycle / fee_notes, never in a
  // DATE column, and is never converted to a fabricated date.
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : s.slice(0, 10);
};

// ---- Data -------------------------------------------------------------------

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data_v2.json'), 'utf8'));
const universities = raw.universities;
console.log(`Seeding ${universities.length} universities from data_v2.json ...`);

const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });

// Table registry: delete-then-insert per university.
// `columns` lists the INSERT columns; each `map(u)` returns one param-array per
// row with values ONLY for the non-id columns (university_id is prepended by
// the runner). An empty array means "delete existing rows, insert nothing".
const TABLES = [
  {
    table: 'university_overview',
    columns: ['university_id', 'history', 'mission', 'vision', 'reputation', 'national_ranking', 'major_strengths', 'notable_alumni', 'key_achievements'],
    map(u) {
      const ov = u.university_overview;
      if (!ov) return [];
      return [[toText(ov.history), toText(ov.mission), toText(ov.vision), toText(ov.reputation), toText(ov.national_ranking), toArr(ov.major_strengths), toArr(ov.notable_alumni), toArr(ov.key_achievements)]];
    },
  },
  {
    table: 'campuses',
    columns: ['university_id', 'campus_name', 'campus_type', 'address', 'city', 'province', 'campus_size_acres', 'virtual_tour_url', 'facilities'],
    map(u) {
      return (u.campuses || []).map((c) => [toText(c.campus_name), toText(c.campus_type), toText(c.address), toText(c.city), toText(c.province), toNum(c.campus_size_acres), toText(c.virtual_tour_url), toArr(c.facilities)]);
    },
  },
  {
    table: 'accreditations',
    columns: ['university_id', 'body_name', 'accreditation_type'],
    map(u) {
      return (u.basic_information?.accreditations || []).map((a) => [toText(a.body), toText(a.type)]);
    },
  },
  {
    table: 'programs',
    columns: ['university_id', 'program_name', 'degree_type', 'duration_years', 'duration_semesters', 'credit_hours', 'approx_merit_requirement', 'eligibility_criteria', 'open_merit_seats', 'self_finance_seats', 'total_seats', 'accrediting_body'],
    map(u) {
      // No program rows exist in data_v2.json yet — delete-only keeps the DB in
      // sync with the source and ready for future data.
      return (u.programs || []).map((p) => [toText(p.program_name), toText(p.degree_type), toNum(p.duration_years), toNum(p.duration_semesters), toNum(p.credit_hours), toText(p.approx_merit_requirement), toText(p.eligibility_criteria), toNum(p.open_merit_seats), toNum(p.self_finance_seats), toNum(p.total_seats), toText(p.accrediting_body)]);
    },
  },
  {
    table: 'admissions',
    columns: ['university_id', 'admission_cycle', 'admission_months', 'application_start', 'application_deadline', 'result_date', 'eligibility_criteria', 'required_documents', 'admission_process', 'merit_calculation_method', 'interview_requirement', 'entry_test_required', 'application_fee_pkr', 'online_application_url'],
    map(u) {
      const a = u.admissions;
      if (!a) return [];
      return [[toText(a.admission_cycle), toText(a.admission_months), toDate(a.application_start), toDate(a.application_deadline), toDate(a.result_date), toText(a.eligibility_criteria), toArr(a.required_documents), toText(a.admission_process), toText(a.merit_calculation_method), toText(a.interview_requirement), a.entry_test_required ?? false, toNum(a.application_fee_pkr), toText(a.online_application_url)]];
    },
  },
  {
    table: 'entry_tests',
    columns: ['university_id', 'test_name', 'test_type', 'test_mode', 'subjects_included', 'total_marks', 'passing_criteria', 'passing_marks', 'test_duration_min', 'test_fee_pkr', 'test_website_url', 'registration_deadline', 'sample_pattern', 'preparation_tips'],
    map(u) {
      return (u.entry_tests || []).map((t) => [toText(t.test_name), toText(t.test_type), toText(t.test_mode), toArr(t.subjects_included), toNum(t.total_marks), toText(t.passing_criteria), toNum(t.passing_marks), toNum(t.test_duration_min), toNum(t.test_fee_pkr), toText(t.test_website_url), toDate(t.registration_deadline), toText(t.sample_pattern), toText(t.preparation_tips)]);
    },
  },
  {
    table: 'fees',
    columns: ['university_id', 'fee_year', 'admission_fee', 'semester_fee', 'credit_hour_fee', 'lab_fee', 'exam_fee', 'hostel_fee_monthly', 'transport_fee_monthly', 'security_deposit', 'alumni_fee', 'approx_total_degree_cost', 'fee_notes'],
    map(u) {
      const f = u.fees;
      if (!f) return [];
      return [[toNum(f.fee_year), toNum(f.admission_fee), toNum(f.semester_fee), toNum(f.credit_hour_fee), toNum(f.lab_fee), toNum(f.exam_fee), toNum(f.hostel_fee_monthly), toNum(f.transport_fee_monthly), toNum(f.security_deposit), toNum(f.alumni_fee), toNum(f.approx_total_degree_cost), toText(f.fee_notes)]];
    },
  },
  {
    table: 'scholarships',
    columns: ['university_id', 'scholarship_name', 'scholarship_type', 'eligibility', 'coverage_percentage', 'coverage_type', 'annual_value_pkr', 'renewable', 'renewable_conditions', 'seats_available', 'external_body', 'application_url'],
    map(u) {
      return (u.scholarships || []).map((s) => [toText(s.scholarship_name), toText(s.scholarship_type), toText(s.eligibility), toNum(s.coverage_percentage), toText(s.coverage_type), toNum(s.annual_value_pkr), s.renewable ?? false, toText(s.renewable_conditions), toNum(s.seats_available), toText(s.external_body), toText(s.application_url)]);
    },
  },
  {
    table: 'academic_policies',
    columns: ['university_id', 'policy_category', 'policy_name', 'policy_value', 'min_cgpa', 'min_attendance_pct'],
    map(u) {
      return (u.academic_policies || []).map((p) => [toText(p.policy_category), toText(p.policy_name), toText(p.policy_value), toNum(p.min_cgpa), toNum(p.min_attendance_pct)]);
    },
  },
  {
    table: 'faculty_academics',
    columns: ['university_id', 'total_faculty_count', 'phd_faculty_count', 'student_faculty_ratio', 'faculty_quality', 'research_culture', 'industry_exposure', 'internship_support', 'fyp_culture'],
    map(u) {
      const fa = u.faculty_academics;
      if (!fa) return [];
      return [[toNum(fa.total_faculty_count), toNum(fa.phd_faculty_count), toNum(fa.student_faculty_ratio), toText(fa.faculty_quality), toText(fa.research_culture), toText(fa.industry_exposure), toText(fa.internship_support), toText(fa.fyp_culture)]];
    },
  },
  {
    table: 'student_life',
    columns: ['university_id', 'clubs_and_societies', 'sports_facilities', 'events_and_festivals', 'student_support_services', 'campus_culture'],
    map(u) {
      const sl = u.student_life;
      if (!sl) return [];
      return [[toArr(sl.clubs).concat(toArr(sl.societies)), toArr(sl.sports_available), toArr(sl.annual_events), [], toText(sl.cultural_activities)]];
    },
  },
  {
    table: 'campus_facilities',
    columns: ['university_id', 'facility_category', 'facility_name', 'description', 'is_available'],
    map(u) {
      return (u.facilities || []).map((f) => [toText(f.facility_category), toText(f.facility_name), toText(f.description), f.is_available ?? true]);
    },
  },
  {
    table: 'hostels',
    columns: ['university_id', 'availability', 'male_hostel_available', 'female_hostel_available', 'room_types', 'monthly_fee_pkr', 'mess_available', 'hostel_rules'],
    map(u) {
      const h = u.hostel;
      if (!h) return [];
      let male = null;
      let female = null;
      if (h.gender === 'Male') male = true;
      else if (h.gender === 'Female') female = true;
      else if (h.gender === 'Both') { male = true; female = true; }
      const availability = h.hostel_availability === true ? 'Yes' : h.hostel_availability === false ? 'No' : null;
      return [[availability, male, female, [], toNum(h.monthly_fee_pkr), h.meals_included ?? null, toText(h.hostel_quality)]];
    },
  },
  {
    table: 'transport',
    columns: ['university_id', 'service_available', 'routes', 'monthly_fee_pkr'],
    map(u) {
      const t = u.transport;
      if (!t) return [];
      return [[t.transport_available ?? false, toArr(t.routes), toNum(t.monthly_fee_pkr)]];
    },
  },
  {
    table: 'placements',
    columns: ['university_id', 'placement_office_url', 'placement_rate_pct', 'avg_starting_salary_pkr', 'industry_partnerships', 'alumni_count', 'linkedin_alumni_url', 'top_recruiters', 'placement_notes'],
    map(u) {
      const p = u.placements;
      if (!p) return [];
      return [[toText(p.placement_office_url), toNum(p.placement_rate_pct), toNum(p.avg_starting_salary_pkr), toArr(p.industry_partnerships), toNum(p.alumni_count), toText(p.linkedin_alumni_url), toArr(p.top_recruiters), toText(p.placement_support)]];
    },
  },
  {
    table: 'career_paths',
    columns: ['university_id', 'career_paths', 'industries', 'government_opportunities', 'private_opportunities', 'higher_education_paths', 'international_opportunities'],
    map(u) {
      const cp = u.career_paths;
      if (!cp) return [];
      return [[toArr(cp.career_paths), toArr(cp.industries), toArr(cp.government_opportunities), toArr(cp.private_sector_opportunities), toArr(cp.higher_education_options), toText(cp.freelancing_opportunities)]];
    },
  },
  {
    table: 'important_links',
    columns: ['university_id', 'link_category', 'label', 'url', 'sort_order', 'description', 'is_unofficial'],
    map(u) {
      return (u.important_links || []).map((l, i) => [toText(l.category), toText(l.label), toText(l.url), i, toText(l.description), l.is_unofficial ?? false]);
    },
  },
];

// ---- Runner -----------------------------------------------------------------

async function main() {
  const client = await pool.connect();
  const totals = {};
  try {
    await client.query('BEGIN');

    for (const u of universities) {
      const bi = u.basic_information || {};
      const name = bi.name || '(unnamed)';

      // 1) Upsert the university by slug, keep the DB-assigned id for children.
      const uniRes = await client.query(
        `INSERT INTO universities (
           university_id, name, short_name, slug, logo_url, official_website, admissions_portal,
           phone, email, address, city, province, country, postal_code,
           year_established, charter_authority, hec_status, university_type, social_media, virtual_tour_url, source_note
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           short_name = EXCLUDED.short_name,
           logo_url = EXCLUDED.logo_url,
           official_website = EXCLUDED.official_website,
           admissions_portal = EXCLUDED.admissions_portal,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           address = EXCLUDED.address,
           city = EXCLUDED.city,
           province = EXCLUDED.province,
           country = EXCLUDED.country,
           postal_code = EXCLUDED.postal_code,
           year_established = EXCLUDED.year_established,
           charter_authority = EXCLUDED.charter_authority,
           hec_status = EXCLUDED.hec_status,
           university_type = EXCLUDED.university_type,
           social_media = EXCLUDED.social_media,
           virtual_tour_url = EXCLUDED.virtual_tour_url,
           source_note = EXCLUDED.source_note,
           is_active = TRUE
         RETURNING university_id`,
        [
          Number(u.university_id), toText(name), toText(bi.short_name), toText(bi.slug),
          toText(bi.logo_url), toText(bi.official_website), toText(bi.admissions_portal),
          toText(bi.phone), toText(bi.email), toText(bi.address), toText(bi.city),
          toText(bi.province), toText(bi.country), toText(bi.postal_code),
          toNum(bi.year_established), toText(bi.charter_authority), toText(bi.hec_status),
          toText(bi.university_type), toJsonObj(bi.social_media), toText(bi.virtual_tour_url), null,
        ]
      );
      const uid = Number(uniRes.rows[0].university_id);

      // 2) Delete-then-insert every child table for this university.
      const parts = [];
      for (const t of TABLES) {
        const rows = t.map(u);
        await client.query(`DELETE FROM ${t.table} WHERE university_id = $1`, [uid]);
        if (rows.length) {
          const placeholders = t.columns.map((_, i) => `$${i + 1}`).join(', ');
          const sql = `INSERT INTO ${t.table} (${t.columns.join(', ')}) VALUES (${placeholders})`;
          for (const row of rows) {
            await client.query(sql, [uid, ...row]);
          }
        }
        totals[t.table] = (totals[t.table] || 0) + rows.length;
        if (rows.length) parts.push(`${t.table}=${rows.length}`);
      }
      console.log(`  [${u.university_id}] ${name}  (${parts.join(', ') || 'no child rows'})`);
    }

    // 3) Keep the identity sequence in sync with the explicit university ids.
    await client.query(`SELECT setval('universities_university_id_seq', (SELECT COALESCE(MAX(university_id), 1) FROM universities))`);

    await client.query('COMMIT');
    console.log('\nSeed committed successfully.');
    console.log('Totals: ' + Object.entries(totals).map(([t, c]) => `${t}=${c}`).join(', '));
    console.log('\nNotes:');
    console.log('  * rankings were skipped (no ranking_year in the source — no fabricated years)');
    console.log('  * reviews and departments were left untouched (community / out-of-scope data)');
    console.log('  * re-running this script is safe: universities upsert by slug, children are replaced per university');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nSeed FAILED — transaction rolled back, database unchanged.');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
