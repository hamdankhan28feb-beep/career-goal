// Admission predictor.
// High / Medium / Low are produced only from a sourced closing aggregate
// (university + programme + year + source URL + verification date).
// There is no house-estimate table. An empty merit file means every
// university is "insufficient verified data".

import meritFile from '../../data/research/merit_aggregates.json' with { type: 'json' };

export type Chance = 'High' | 'Medium' | 'Low';

export type MeritAggregate = {
  university_slug: string;
  programme: string;
  academic_year: string;
  closing_aggregate: number;
  source_url: string;
  source_title?: string;
  last_verified_at: string;
  notes?: string;
};

export function meritAggregates(): MeritAggregate[] {
  const rows = (meritFile as { aggregates?: MeritAggregate[] }).aggregates ?? [];
  return rows.filter(isUsableMerit);
}

export function isUsableMerit(row: Partial<MeritAggregate> | null | undefined): row is MeritAggregate {
  if (!row) return false;
  return Boolean(
    row.university_slug &&
      row.programme &&
      row.academic_year &&
      row.source_url &&
      /^https?:\/\//.test(row.source_url) &&
      row.last_verified_at &&
      /^\d{4}-\d{2}-\d{2}/.test(row.last_verified_at) &&
      typeof row.closing_aggregate === 'number' &&
      Number.isFinite(row.closing_aggregate) &&
      row.closing_aggregate >= 0 &&
      row.closing_aggregate <= 100,
  );
}

export function meritsForSlug(slug: string): MeritAggregate[] {
  return meritAggregates().filter((m) => m.university_slug === slug);
}

export type PercentCheck =
  | { ok: true; value: number }
  | { ok: false; error: string };

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

export function validateBudget(raw: string | number | null | undefined): { ok: true; value: number | null } | { ok: false; error: string } {
  const text = raw === null || raw === undefined ? '' : String(raw).trim();
  if (text === '') return { ok: true, value: null };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, error: 'Budget must be a positive number (lakh PKR) or left blank.' };
  return { ok: true, value: Number(text) };
}

/** Weighted aggregate. Callers must not describe this as an official university formula. */
export function computeAggregate(matricPct: number, interPct: number, interWeight = 0.6): number {
  return interPct * interWeight + matricPct * (1 - interWeight);
}

/**
 * High   = aggregate at least 10 points above the sourced closing aggregate
 * Medium = aggregate 0 to <10 points above it
 * Low    = aggregate below it
 * null   = no usable sourced aggregate (do not invent a label)
 */
export function computeChance(aggregate: number, benchmark: number | null): Chance | null {
  if (benchmark === null || !Number.isFinite(benchmark)) return null;
  const diff = aggregate - benchmark;
  if (diff >= 10) return 'High';
  if (diff >= 0) return 'Medium';
  return 'Low';
}

export function chanceForUniversity(aggregate: number, slug: string): { chance: Chance; merit: MeritAggregate } | null {
  const merits = meritsForSlug(slug);
  if (!merits.length) return null;
  const merit = [...merits].sort((a, b) => b.academic_year.localeCompare(a.academic_year))[0];
  const chance = computeChance(aggregate, merit.closing_aggregate);
  if (!chance) return null;
  return { chance, merit };
}
