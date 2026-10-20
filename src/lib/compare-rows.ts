import type { University } from '@/lib/types';
import { campusCountLabel, profileHeadline, ratingsForSlug } from '@/lib/evidence';
import { profileCompleteness } from '@/lib/display-utils';
import { findProfileField } from '@/lib/profile-utils';

const na = 'Not available';

export const COMPARISON_ROWS: { key: string; label: string; format: (u: University) => string }[] = [
  { key: 'city', label: 'City', format: (u) => u.city || na },
  { key: 'type', label: 'Type', format: (u) => u.universityType || na },
  { key: 'established', label: 'Established', format: (u) => (u.yearEstablished ? String(u.yearEstablished) : na) },
  {
    key: 'hec',
    label: 'HEC ORIC category',
    format: (u) => {
      const r = ratingsForSlug(u.slug).find((row) => row.label === 'ORIC category');
      if (!r) return na;
      return `${r.value} · category · ${r.authority} · ${r.year}`;
    },
  },
  { key: 'campuses', label: 'Campuses', format: (u) => campusCountLabel(u.sourcedCampusCount) },
  { key: 'programs', label: 'Programs', format: (u) => (u.programsCount > 0 ? String(u.programsCount) : na) },
  { key: 'scholarships', label: 'Scholarships (legacy)', format: () => na },
  { key: 'accreditations', label: 'Accreditations (legacy)', format: () => na },
  { key: 'semester_fee', label: 'Semester fee', format: () => na },
  { key: 'admission_fee', label: 'Admission fee', format: () => na },
  { key: 'hostel', label: 'Hostel', format: () => na },
  { key: 'transport', label: 'Transport', format: () => na },
  { key: 'phd_faculty', label: 'PhD faculty', format: () => na },
  { key: 'ratio', label: 'Student:Faculty', format: () => na },
  { key: 'placement', label: 'Placement rate', format: () => na },
  {
    key: 'profile',
    label: 'Profile',
    format: (u) => {
      if (!u.profile) return na;
      const checked = u.profile.last_checked ? `, verification log ${u.profile.last_checked}` : '';
      return `${profileHeadline(u.profile)} (${u.profile.field_counts.sourced} sourced${checked})`;
    },
  },
  { key: 'tuition', label: 'Tuition (profile)', format: (u) => findProfileField(u.profile?.sections.fees ?? [], /^Tuition/)?.value ?? na },
  {
    key: 'computing',
    label: 'CS / AI / DS / SE (UG)',
    format: (u) =>
      (u.profile?.sections.programs ?? [])
        .filter((f) => f.value && /computer science|artificial intelligence|data science|software engineering/i.test(f.label) && !/not offered|not listed/i.test(f.value))
        .map((f) => f.label.replace(/^(BS|BE\/BS) /, ''))
        .join(', ') || na,
  },
  { key: 'test', label: 'Admission test', format: (u) => findProfileField(u.profile?.sections.admissions ?? [], /admission test/i)?.value ?? na },
  { key: 'data', label: 'Sourced-field share', format: (u) => {
    const pct = profileCompleteness(u.profile);
    return pct === null ? na : `${pct}%`;
  } },
];
