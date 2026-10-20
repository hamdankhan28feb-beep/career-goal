import type { ProfileField, ProfileFieldStatus, University, UniversityProfile } from '@/lib/types';
import { PROFILE_SECTION_ORDER } from '@/lib/profile-utils';
import verificationLog from '../../data/research/verification_events.json' with { type: 'json' };
import conflictsFile from '../../data/research/field_conflicts.json' with { type: 'json' };
import ratingsFile from '../../data/research/ratings.json' with { type: 'json' };

export type EvidenceStatus = 'verified' | 'approximate' | 'unverified' | 'unavailable';

export type EvidenceFieldInput = {
  status?: string | null;
  value?: string | null;
  source_url?: string | null;
  last_verified_at?: string | null;
};

export type VerificationEvent = {
  entity_type: string;
  entity_id: string;
  field_key: string;
  source_url: string;
  source_title: string;
  checked_at: string;
  checker: string;
  notes?: string;
};

export type RatingRecord = {
  university_slug: string;
  kind: 'ranking' | 'category';
  authority: string;
  year: string;
  label: string;
  value: string;
  source_url: string;
  source_title: string;
  last_verified_at: string;
  notes?: string;
};

export type ConflictValue = {
  label: string;
  values: string[];
  source_url?: string;
  source_title?: string;
  last_verified_at?: string;
  note?: string;
};

export type FieldConflict = {
  entity_type: string;
  entity_id: string;
  field_key: string;
  primary: ConflictValue & { status: EvidenceStatus };
  alternatives: ConflictValue[];
};

const NOT_AVAILABLE = 'Not available';

export function verificationEvents(): VerificationEvent[] {
  return (verificationLog as { events: VerificationEvent[] }).events ?? [];
}

export function ratingsForSlug(slug: string): RatingRecord[] {
  return ((ratingsFile as { ratings: RatingRecord[] }).ratings ?? []).filter((r) => r.university_slug === slug);
}

export function allRatings(): RatingRecord[] {
  return (ratingsFile as { ratings: RatingRecord[] }).ratings ?? [];
}

export function conflictsFor(entityId: string, fieldKey?: string): FieldConflict[] {
  const all = (conflictsFile as { conflicts: FieldConflict[] }).conflicts ?? [];
  return all.filter((c) => c.entity_id === entityId && (!fieldKey || c.field_key === fieldKey));
}

export function latestVerificationDate(entityId?: string): string | null {
  const dates = verificationEvents()
    .filter((e) => (entityId ? e.entity_id === entityId : true) && e.checked_at && e.source_url)
    .map((e) => e.checked_at)
    .sort();
  return dates.length ? dates[dates.length - 1] : null;
}

export function eventFor(entityId: string, fieldKey: string): VerificationEvent | undefined {
  return verificationEvents().find(
    (e) => e.entity_id === entityId && e.field_key === fieldKey && Boolean(e.source_url) && Boolean(e.checked_at),
  );
}

/** Map stored words onto the four evidence statuses. Unknown words are unverified. */
export function normalizeEvidenceStatus(status?: string | null): EvidenceStatus {
  const s = (status || '').toLowerCase();
  if (s === 'verified') return 'verified';
  if (s === 'approximate' || s === 'partial') return 'approximate';
  if (s === 'unavailable' || s === 'not_available') return 'unavailable';
  if (s === 'unverified' || s === 'needs_verification' || s === 'needs review') return 'unverified';
  return 'unverified';
}

/**
 * Overall badge. Pure: same fields always produce the same status.
 * Verified only when every valued field is verified and itself has a source URL and a verification date.
 * Approximate when any valued field is verified or approximate but the set is not fully verified.
 * Unverified when values exist but none are verified or approximate.
 * Unavailable when there is no valued field.
 */
export function deriveUniversityStatus(fields: EvidenceFieldInput[]): EvidenceStatus {
  const valued = fields.filter((f) => {
    if (normalizeEvidenceStatus(f.status) === 'unavailable') return false;
    return Boolean(f.value && String(f.value).trim());
  });
  if (valued.length === 0) return 'unavailable';
  const allVerified = valued.every((f) => {
    return (
      normalizeEvidenceStatus(f.status) === 'verified' &&
      Boolean(f.source_url && String(f.source_url).trim()) &&
      Boolean(f.last_verified_at && String(f.last_verified_at).trim())
    );
  });
  if (allVerified) return 'verified';
  const anySupported = valued.some((f) => {
    const s = normalizeEvidenceStatus(f.status);
    const hasSource = Boolean(f.source_url && String(f.source_url).trim());
    if (s === 'verified') return hasSource && Boolean(f.last_verified_at && String(f.last_verified_at).trim());
    return s === 'approximate' && hasSource;
  });
  return anySupported ? 'approximate' : 'unverified';
}

export function profileFields(profile: UniversityProfile | null | undefined): ProfileField[] {
  if (!profile) return [];
  return PROFILE_SECTION_ORDER.flatMap((key) => profile.sections[key] ?? []);
}

export function deriveFieldCounts(fields: ProfileField[]): UniversityProfile['field_counts'] {
  const counts = { sourced: 0, verified: 0, partial: 0, unavailable: 0, needs_verification: 0 };
  for (const f of fields) {
    if (f.status === 'verified') counts.verified += 1;
    else if (f.status === 'partial') counts.partial += 1;
    else if (f.status === 'needs_verification') counts.needs_verification += 1;
    else counts.unavailable += 1;
    if ((f.status === 'verified' || f.status === 'partial') && f.value) counts.sourced += 1;
  }
  return counts;
}

function sourceUrl(profile: UniversityProfile, field: ProfileField): string | null {
  if (!field.source) return null;
  const src = profile.sources.find((s) => s.id === field.source);
  return src?.url || null;
}

/**
 * A stored "verified" field is shown as verified only when a verification event
 * records a source URL and a date for that field. Otherwise the figure is withheld.
 */
export function gateProfileField(profile: UniversityProfile, field: ProfileField): ProfileField {
  const url = sourceUrl(profile, field);
  const event = eventFor(profile.slug, field.label) || (field.source ? eventFor(profile.slug, field.source) : undefined);
  if (field.status === 'verified' || field.status === 'partial') {
    if (!url || !event) {
      return {
        ...field,
        value: null,
        status: 'needs_verification',
        note: 'Needs review. A stored value is shown only after a verification event records a source URL and a check date for this field.',
      };
    }
    return field;
  }
  return field;
}

export function prepareProfile(profile: UniversityProfile | null | undefined): UniversityProfile | null {
  if (!profile) return null;
  const sections = {} as UniversityProfile['sections'];
  for (const key of PROFILE_SECTION_ORDER) {
    sections[key] = (profile.sections[key] ?? []).map((f) => gateProfileField(profile, f));
  }
  const fields = PROFILE_SECTION_ORDER.flatMap((key) => sections[key]);
  const checked = latestVerificationDate(profile.slug);
  return {
    ...profile,
    last_checked: checked ?? '',
    sections,
    field_counts: deriveFieldCounts(fields),
  };
}

export function profileEvidenceInputs(profile: UniversityProfile | null | undefined): EvidenceFieldInput[] {
  if (!profile) return [];
  return profileFields(profile).map((f) => {
    const event = eventFor(profile.slug, f.label) || (f.source ? eventFor(profile.slug, f.source) : undefined);
    return {
      status: f.status === 'partial' ? 'approximate' : f.status === 'verified' ? 'verified' : f.status === 'unavailable' ? 'unavailable' : 'unverified',
      value: f.value,
      source_url: sourceUrl(profile, f),
      last_verified_at: event?.checked_at ?? null,
    };
  });
}

export function universityBadge(profile: UniversityProfile | null | undefined): EvidenceStatus {
  if (!profile) return 'unverified';
  return deriveUniversityStatus(profileEvidenceInputs(profile));
}

export function profileHeadline(profile: UniversityProfile | null | undefined): string {
  const status = universityBadge(profile);
  if (status === 'verified') return 'Sourced profile';
  if (status === 'approximate') return 'Partial profile';
  if (status === 'unverified') return 'Profile needs review';
  return 'Profile not yet verified';
}

/** Missing campus data is "Not available". Never invent 1, and never show 0 as a count. */
export function campusCountLabel(count: number | null | undefined): string {
  if (typeof count === 'number' && Number.isFinite(count) && count > 0) return String(count);
  return NOT_AVAILABLE;
}

export function sourcedCampusCount(slug: string): number | null {
  const conflict = conflictsFor(slug, 'campuses')[0];
  if (!conflict) return null;
  if (conflict.primary.status !== 'verified') return null;
  if (!conflict.primary.source_url || !conflict.primary.last_verified_at) return null;
  const n = conflict.primary.values.filter((v) => v.trim()).length;
  return n > 0 ? n : null;
}

/**
 * Legacy catalogue facts are kept in the JSON/DB. Display copies drop figures
 * that have no source URL: fees, rankings, accreditation labels, facility booleans.
 */
export function applyDisplayPolicy(university: University): University {
  const profile = prepareProfile(university.profile);
  const campusCount = sourcedCampusCount(university.slug);
  const campusConflict = conflictsFor(university.slug, 'campuses')[0];
  const campuses =
    campusCount && campusConflict
      ? campusConflict.primary.values.map((name) => ({
          campus_name: name,
          campus_type: null,
          address: null,
          city: university.city,
          province: university.province,
          campus_size_acres: null,
          virtual_tour_url: null,
          facilities: [],
        }))
      : [];

  return {
    ...university,
    hecStatus: null,
    yearEstablished: null,
    fees: null,
    rankings: [],
    accreditations: [],
    scholarships: [],
    hostel: null,
    transport: null,
    facultyAcademics: null,
    placements: null,
    admissions: university.admissions
      ? {
          ...university.admissions,
          application_fee_pkr: null,
          application_deadline: null,
          application_start: null,
          result_date: null,
          merit_calculation_method: null,
        }
      : null,
    entryTests: university.entryTests.map((t) => ({
      ...t,
      test_fee_pkr: null,
      passing_marks: null,
      total_marks: null,
    })),
    programs: university.programs.map((p) => ({
      ...p,
      approx_merit_requirement: null,
      open_merit_seats: null,
      self_finance_seats: null,
      total_seats: null,
    })),
    dataCompleteness: 0,
    campuses,
    sourcedCampusCount: campusCount,
    profile,
  };
}

export function deriveScholarshipKind(input: {
  name?: string | null;
  eligibility?: string | null;
  notes?: string | null;
}): string {
  const text = `${input.name || ''} ${input.eligibility || ''} ${input.notes || ''}`.toLowerCase();
  const merit = /merit|topper|board position|academic excellence|highest marks|cgpa|gpa/.test(text);
  const need = /need-based|need based|financial need|household income|hardship|zakat/.test(text);
  const sports = /sport/.test(text);
  if (merit && need) return 'Merit and need';
  if (merit) return 'Merit';
  if (need) return 'Need-based';
  if (sports) return 'Sports';
  return 'Unknown';
}

export type ScholarshipWindow = 'open' | 'upcoming' | 'closed' | 'unknown';

export function normalizeScholarshipWindow(status?: string | null): ScholarshipWindow {
  const v = (status || '').toLowerCase();
  if (v === 'open' || v === 'active') return 'open';
  if (v === 'upcoming') return 'upcoming';
  if (v === 'closed') return 'closed';
  return 'unknown';
}

export function quizCategoryCount(questions: Array<{ category: string }>): number {
  return new Set(questions.map((q) => q.category)).size;
}

/** Records the UI is allowed to call Verified. Used by the evidence test. */
export function verifiedRecords(): Array<{ id: string; source_url?: string; last_verified_at?: string }> {
  const out: Array<{ id: string; source_url?: string; last_verified_at?: string }> = [];
  for (const e of verificationEvents()) {
    out.push({ id: `event:${e.entity_id}:${e.field_key}`, source_url: e.source_url, last_verified_at: e.checked_at });
  }
  for (const r of allRatings()) {
    out.push({ id: `rating:${r.university_slug}:${r.label}`, source_url: r.source_url, last_verified_at: r.last_verified_at });
  }
  for (const c of (conflictsFile as { conflicts: FieldConflict[] }).conflicts ?? []) {
    if (c.primary.status === 'verified') {
      out.push({
        id: `conflict:${c.entity_id}:${c.field_key}`,
        source_url: c.primary.source_url,
        last_verified_at: c.primary.last_verified_at,
      });
    }
  }
  return out;
}

export function isVerifiedRecordComplete(record: { source_url?: string | null; last_verified_at?: string | null }): boolean {
  return Boolean(record.source_url && String(record.source_url).trim() && record.last_verified_at && String(record.last_verified_at).trim());
}

export const NOT_AVAILABLE_LABEL = NOT_AVAILABLE;

export type { ProfileFieldStatus };
