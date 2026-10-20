import batch1 from '../../data/research/university_profiles_batch1.json';
import batch2 from '../../data/research/university_profiles_batch2.json';
import batch3 from '../../data/research/university_profiles_batch3.json';
import type { UniversityProfile } from '@/lib/types';

/** Bundled (fallback) detailed profiles. The DB copy (universities.profile_details) wins when present. */
const BUNDLED_PROFILES: UniversityProfile[] = [batch1, batch2, batch3].flatMap(
  (b) => (b as unknown as { profiles: UniversityProfile[] }).profiles
);

/** All bundled profiles (used to list profile-only universities when the DB is unavailable). */
export function getAllBundledProfiles(): UniversityProfile[] {
  return BUNDLED_PROFILES;
}

export function getBundledProfile(slug?: string | null, researchId?: string | null): UniversityProfile | null {
  return (
    BUNDLED_PROFILES.find((p) => (researchId && p.research_id === researchId) || (slug && p.slug === slug)) ?? null
  );
}

export function isUniversityProfile(v: unknown): v is UniversityProfile {
  return !!v && typeof v === 'object' && 'sections' in (v as object) && 'sources' in (v as object);
}
