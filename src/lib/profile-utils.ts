import type { ProfileField, ProfileFieldStatus, UniversityProfile } from '@/lib/types';

export const PROFILE_SECTION_ORDER = [
  'overview',
  'programs',
  'admissions',
  'fees',
  'scholarships',
  'facilities',
] as const;

export const PROFILE_STATUS_LABEL: Record<ProfileFieldStatus, string> = {
  verified: 'Verified',
  partial: 'Partial',
  unavailable: 'Unavailable',
  needs_verification: 'Needs verification',
};

/** Lower-cased text used by search / compare filters (name, programmes, overview values). */
export function profileSearchText(p: UniversityProfile | null | undefined): string {
  if (!p) return '';
  const parts: string[] = [p.official_name];
  for (const f of [...p.sections.programs, ...p.sections.overview]) {
    parts.push(f.label);
    if (f.value) parts.push(f.value);
  }
  return parts.join(' ').toLowerCase();
}

export function findProfileField(fields: ProfileField[], match: RegExp): ProfileField | undefined {
  return fields.find((f) => match.test(f.label) && f.value && f.status !== 'unavailable');
}

/** Section nav for the detailed profile (kept out of the 'use client' component so server pages can read it). */
export const PROFILE_NAV = [
  { id: 'profile-overview', label: 'Overview & Campus' },
  { id: 'profile-programs', label: 'UG Programs' },
  { id: 'profile-admissions', label: 'Eligibility & Admissions' },
  { id: 'profile-fees', label: 'Fees' },
  { id: 'profile-scholarships', label: 'Scholarships & Aid' },
  { id: 'profile-facilities', label: 'Facilities' },
  { id: 'profile-sources', label: 'Sources' },
];
