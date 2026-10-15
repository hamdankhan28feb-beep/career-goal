import type { UniversityProfile } from '@/lib/types';

const STOP = new Set(['of', 'and', 'the', 'for', '&', 'campus', 'pakistan']);

/**
 * Logo-tile initials, max 7 chars: a leading acronym from the short name (FAST, NED, IBA, SZABIST),
 * else an acronym found in the full name, else initials of the full name without the city (Bahria University -> BU).
 */
export function logoInitials(shortName: string, name: string, city?: string | null): string {
  const first = shortName.split(/[\s\-\u2013(,]+/)[0] ?? '';
  if (/^[A-Z0-9&]{2,7}$/.test(first)) return first;
  const cityLc = city?.toLowerCase();
  const words = name
    .replace(/\(.*?\)/g, ' ')
    .split(/[\s\-\u2013,]+/)
    .filter((w) => w && !STOP.has(w.toLowerCase()) && w.toLowerCase() !== cityLc);
  const acronym = words.find((w) => /^[A-Z]{2,7}$/.test(w));
  if (acronym) return acronym;
  const initials = words.map((w) => w[0]).filter((c) => /[A-Za-z]/.test(c)).join('').toUpperCase();
  return (initials.length >= 2 ? initials : shortName.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()).slice(0, 4);
}

/** Tailwind text size for a logo tile so 2-7 character initials fit. */
export function initialsSize(initials: string, size: 'sm' | 'lg' = 'sm'): string {
  if (size === 'lg') return initials.length <= 3 ? 'text-3xl' : initials.length <= 4 ? 'text-2xl' : 'text-lg';
  return initials.length <= 3 ? 'text-sm' : initials.length <= 4 ? 'text-xs' : 'text-[10px]';
}

/** Share of profile fields that are sourced (verified + partial), from the profile's own field counts. */
export function profileCompleteness(p: UniversityProfile | null | undefined): number | null {
  if (!p) return null;
  const c = p.field_counts;
  const total = c.verified + c.partial + c.unavailable + c.needs_verification;
  if (!total) return null;
  return Math.round(((c.verified + c.partial) / total) * 100);
}
