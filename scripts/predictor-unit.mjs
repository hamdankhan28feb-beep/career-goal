// Unit checks for src/lib/predictor.ts (pure logic, no browser needed).
// Run: node scripts/predictor-unit.mjs
import assert from 'node:assert/strict';
import {
  chanceForUniversity,
  computeAggregate,
  computeChance,
  isUsableMerit,
  meritAggregates,
  validateBudget,
  validatePercent,
} from '../src/lib/predictor.ts';

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('PASS', name); };

t('aggregate = 0.6*inter + 0.4*matric and is not an official cutoff', () => {
  assert.equal(computeAggregate(85, 80), 82);
  assert.equal(computeAggregate(0, 0), 0);
  assert.equal(computeAggregate(100, 100), 100);
});
t('valid percentages accepted incl. boundaries', () => {
  for (const v of ['0', '100', '0.0', '99.9', '85', ' 72.5 ']) assert.equal(validatePercent(v).ok, true, v);
  assert.deepEqual(validatePercent('100'), { ok: true, value: 100 });
});
t('missing percentage rejected', () => {
  for (const v of ['', '   ', null, undefined]) {
    const r = validatePercent(v, 'Matric percentage');
    assert.equal(r.ok, false);
    assert.match(r.error, /required/);
  }
});
t('invalid percentage rejected', () => {
  for (const [v, re] of [['abc', /number/], ['12abc', /number/], ['1e2', /number/], ['-1', /negative/], ['-0.5', /negative/], ['100.1', /more than 100/], ['101', /more than 100/], ['NaN', /number/], ['Infinity', /number/]]) {
    const r = validatePercent(v);
    assert.equal(r.ok, false, v);
    assert.match(r.error, re, v);
  }
});
t('budget optional, must be non-negative number', () => {
  assert.deepEqual(validateBudget(''), { ok: true, value: null });
  assert.deepEqual(validateBudget('3.5'), { ok: true, value: 3.5 });
  assert.equal(validateBudget('abc').ok, false);
  assert.equal(validateBudget('-2').ok, false);
});
t('chance bands use a numeric benchmark only', () => {
  assert.equal(computeChance(92, 82), 'High');
  assert.equal(computeChance(91.9, 82), 'Medium');
  assert.equal(computeChance(82, 82), 'Medium');
  assert.equal(computeChance(81.9, 82), 'Low');
  assert.equal(computeChance(99, null), null);
  assert.equal(computeChance(99, Number.NaN), null);
});
t('no house-estimate table and no chance without a sourced aggregate', () => {
  assert.equal(meritAggregates().length, 0);
  assert.equal(chanceForUniversity(99, 'fast-nuces-karachi'), null);
  assert.equal(chanceForUniversity(99, 'neduet-karachi'), null);
  assert.equal(chanceForUniversity(99, 'iba-karachi'), null);
  assert.equal(isUsableMerit({ university_slug: 'x', programme: 'BS', academic_year: '2026', closing_aggregate: 80, source_url: '', last_verified_at: '2026-10-19' }), false);
  assert.equal(isUsableMerit({ university_slug: 'x', programme: 'BS', academic_year: '2026', closing_aggregate: 80, source_url: 'https://example.edu/merit', last_verified_at: '' }), false);
});
console.log(`\n${n} predictor unit checks passed`);
