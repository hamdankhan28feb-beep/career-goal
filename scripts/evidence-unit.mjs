// Evidence rules: Verified requires a source URL and a verification date.
// Run: node scripts/evidence-unit.mjs
import assert from 'node:assert/strict';
import { researchStats } from '../src/lib/research-meta.ts';
import { COMPARISON_ROWS } from '../src/lib/compare-rows.ts';
import { QUIZ_QUESTIONS, quizCategories } from '../src/lib/quiz-questions.ts';
import { countBundledProfiles } from '../src/lib/university-profiles.ts';
import universities from '../data/research/universities_karachi.json' with { type: 'json' };
import {
  campusCountLabel,
  deriveScholarshipKind,
  deriveUniversityStatus,
  gateProfileField,
  isVerifiedRecordComplete,
  normalizeScholarshipWindow,
  verifiedRecords,
} from '../src/lib/evidence.ts';

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('PASS', name); };

t('every Verified record has a source URL and a verification date', () => {
  const records = verifiedRecords();
  assert.ok(records.length > 0);
  for (const record of records) {
    assert.equal(isVerifiedRecordComplete(record), true, record.id);
  }
});
t('deriveUniversityStatus is a pure function of the fields', () => {
  assert.equal(deriveUniversityStatus([]), 'unavailable');
  assert.equal(deriveUniversityStatus([{ status: 'unavailable', value: null }]), 'unavailable');
  assert.equal(
    deriveUniversityStatus([{ status: 'verified', value: 'NED', source_url: 'https://www.neduet.edu.pk/', last_verified_at: '2026-10-19' }]),
    'verified',
  );
  assert.equal(
    deriveUniversityStatus([{ status: 'verified', value: 'NED', source_url: 'https://www.neduet.edu.pk/' }]),
    'unverified',
  );
  assert.equal(
    deriveUniversityStatus([
      { status: 'verified', value: 'A', source_url: 'https://example.edu/a', last_verified_at: '2026-10-19' },
      { status: 'approximate', value: 'B', source_url: 'https://example.edu/b', last_verified_at: '2026-10-19' },
    ]),
    'approximate',
  );
  assert.equal(deriveUniversityStatus([{ status: 'unverified', value: 'hidden figure' }]), 'unverified');
});
t('a stored verified field without an event is withheld', () => {
  const profile = {
    research_id: 't',
    slug: 'no-such-university',
    official_name: 'Example',
    profile_status: 'partial',
    last_checked: '2026-10-11',
    sources: [{ id: 'S1', title: 'Example', url: 'https://example.edu/', checked: '2026-10-11' }],
    sections: { overview: [], programs: [], admissions: [], fees: [], scholarships: [], facilities: [] },
    field_counts: { sourced: 1, verified: 1, partial: 0, unavailable: 0, needs_verification: 0 },
  };
  const gated = gateProfileField(profile, { label: 'Tuition', value: 'PKR 1', status: 'verified', source: 'S1' });
  assert.equal(gated.value, null);
  assert.equal(gated.status, 'needs_verification');
});
t('catalogue counts come from the records', () => {
  const stats = researchStats();
  assert.equal(stats.universitiesTotal, universities.length);
  assert.equal('checkedAt' in stats, false);
  assert.equal(QUIZ_QUESTIONS.length, 24);
  assert.equal(quizCategories().length, 9);
  assert.equal(COMPARISON_ROWS.length, 20);
  assert.equal(countBundledProfiles(), 18);
});
t('missing campus counts are Not available', () => {
  for (const value of [null, undefined, 0, -1, Number.NaN]) {
    const label = campusCountLabel(value);
    assert.equal(label, 'Not available');
    assert.notEqual(label, '1');
    assert.notEqual(label, '0');
  }
  assert.equal(campusCountLabel(4), '4');
});
t('scholarship kind is not copied from the provider type', () => {
  assert.equal(deriveScholarshipKind({ name: 'Board position award', eligibility: 'topper' }), 'Merit');
  assert.equal(deriveScholarshipKind({ name: 'University grant', eligibility: '' }), 'Unknown');
  assert.equal(normalizeScholarshipWindow('active'), 'open');
  assert.equal(normalizeScholarshipWindow(''), 'unknown');
});

console.log(`\n${n} evidence unit checks passed`);
