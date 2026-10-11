// Shared, dependency-free admission predictor logic.
//
// IMPORTANT: the benchmark aggregates below are FuturePath's own rough
// estimates carried over from the original prototype. They are NOT official
// merit lists or published closing cutoffs, and they have not been verified
// against university sources. Universities without a benchmark are reported
// as "no benchmark" instead of being scored against an invented default.

export type Chance = 'High' | 'Medium' | 'Low';

export const BENCHMARK_AGGREGATES: Readonly<Record<string, number>> = {
  'IBA Karachi': 88,
  PIEAS: 92,
  'FAST Karachi': 82,
  NEDUET: 80,
  'Habib University': 85,
  'Bahria Karachi': 70,
  MAJU: 68,
  SZABIST: 70,
  DSU: 72,
  DUET: 65,
  UoK: 60,
  SSUET: 62,
  IoBM: 70,
  'Iqra University': 60,
  COMSATS: 72,
  'Ziauddin University': 65,
  'Indus University': 55,
  'Hamdard University': 60,
};

export const AGGREGATE_FORMULA = 'Intermediate 60% + Matric 40%';

export type PercentCheck =
  | { ok: true; value: number }
  | { ok: false; error: string };

/** Validate a raw percentage input (string from a form field or a number). */
export function validatePercent(raw: string | number | null | undefined, label = 'Percentage'): PercentCheck {
  if (raw === null || raw === undefined) return { ok: false, error: `${label} is required.` };
  const text = String(raw).trim();
  if (text === '') return { ok: false, error: `${label} is required.` };
  if (!/^-?\d+(\.\d+)?$/.test(text)) return { ok: false, error: `${label} must be a number between 0 and 100.` };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, error: `${label} must be a number between 0 and 100.` };
  if (value < 0) return { ok: false, error: `${label} cannot be negative.` };
  if (value > 100) return { ok: false, error: `${label} cannot be more than 100.` };
  return { ok: true, value };
}

/** Validate an optional budget (lakh PKR). Empty means "no budget filter". */
export function validateBudget(raw: string | number | null | undefined): { ok: true; value: number | null } | { ok: false; error: string } {
  const text = raw === null || raw === undefined ? '' : String(raw).trim();
  if (text === '') return { ok: true, value: null };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, error: 'Budget must be a positive number (lakh PKR) or left blank.' };
  return { ok: true, value: Number(text) };
}

export function computeAggregate(matricPct: number, interPct: number): number {
  return interPct * 0.6 + matricPct * 0.4;
}

export function getBenchmark(shortName: string): number | null {
  return Object.prototype.hasOwnProperty.call(BENCHMARK_AGGREGATES, shortName)
    ? BENCHMARK_AGGREGATES[shortName]
    : null;
}

/**
 * High   = aggregate at least 10 points above the benchmark
 * Medium = aggregate 0 to <10 points above the benchmark
 * Low    = aggregate below the benchmark
 * null   = no benchmark for this university (we do not guess one)
 */
export function computeChance(aggregate: number, shortName: string): Chance | null {
  const benchmark = getBenchmark(shortName);
  if (benchmark === null) return null;
  const diff = aggregate - benchmark;
  if (diff >= 10) return 'High';
  if (diff >= 0) return 'Medium';
  return 'Low';
}
