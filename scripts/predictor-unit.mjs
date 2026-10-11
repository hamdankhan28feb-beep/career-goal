// Unit checks for src/lib/predictor.ts (pure logic, no browser needed).
// Run: node scripts/predictor-unit.mjs   (Node >= 22.18 / 24 strips TS types natively)
import assert from 'node:assert/strict';
import {
  BENCHMARK_AGGREGATES,
  computeAggregate,
  computeChance,
  getBenchmark,
  validateBudget,
  validatePercent,
} from '../src/lib/predictor.ts';

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('PASS', name); };

t('aggregate = 0.6*inter + 0.4*matric', () => {
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
t('chance bands relative to benchmark (FAST Karachi = 82)', () => {
  assert.equal(getBenchmark('FAST Karachi'), 82);
  assert.equal(computeChance(92, 'FAST Karachi'), 'High');
  assert.equal(computeChance(91.9, 'FAST Karachi'), 'Medium');
  assert.equal(computeChance(82, 'FAST Karachi'), 'Medium');
  assert.equal(computeChance(81.9, 'FAST Karachi'), 'Low');
});
t('no invented default cutoff for unknown universities', () => {
  assert.equal(getBenchmark('Some Unlisted University'), null);
  assert.equal(computeChance(99, 'Some Unlisted University'), null);
  assert.equal(getBenchmark('toString'), null);
});
t('benchmarks are within 0..100', () => {
  for (const v of Object.values(BENCHMARK_AGGREGATES)) assert.ok(v >= 0 && v <= 100);
});
console.log(`\n${n} predictor unit checks passed`);
