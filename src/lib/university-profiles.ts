import batch1 from '../../data/research/university_profiles_batch1.json' with { type: 'json' };
import batch2 from '../../data/research/university_profiles_batch2.json' with { type: 'json' };
import batch3 from '../../data/research/university_profiles_batch3.json' with { type: 'json' };
import batch4 from '../../data/research/university_profiles_batch4.json' with { type: 'json' };
import batch5 from '../../data/research/university_profiles_batch5.json' with { type: 'json' };
import type { UniversityProfile } from '@/lib/types';

/** Bundled (fallback) detailed profiles. The DB copy (universities.profile_details) wins when present. */
const BUNDLED_PROFILES: UniversityProfile[] = [batch1, batch2, batch3, batch4, batch5].flatMap(
  (b) => (b as unknown as { profiles: UniversityProfile[] }).profiles
);

export function countBundledProfiles(): number {
  return BUNDLED_PROFILES.length;
}

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
