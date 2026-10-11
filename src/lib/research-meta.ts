import universities from '../../data/research/universities_karachi.json';
import scholarships from '../../data/research/scholarships.json';
import learningResources from '../../data/research/learning_resources.json';

export type ResearchUniversity = {
  id?: string;
  hec_name?: string;
  common_name?: string;
  ownership?: string;
  hec_recognised?: string;
  admissions_url?: string;
  fee_notes?: string;
  programs_cs?: string;
  programs_se?: string;
  programs_ai?: string;
  programs_ds?: string;
  last_verified_at?: string;
  verification_status?: string;
  city?: string;
  [key: string]: string | undefined;
};

export type ResearchScholarship = {
  name?: string;
  status?: string;
  provider?: string;
  last_verified_at?: string;
  application_url?: string;
  source_url?: string;
  [key: string]: string | undefined;
};

export const researchUniversities = universities as ResearchUniversity[];
export const researchScholarships = scholarships as ResearchScholarship[];
export const researchLearningResources = learningResources as Array<Record<string, string>>;

export function researchStats() {
  const verified = researchUniversities.filter((u) => (u.verification_status || '').toLowerCase() === 'verified').length;
  const partial = researchUniversities.filter((u) => (u.verification_status || '').toLowerCase() === 'partial').length;
  const scholarshipsUnknown = researchScholarships.filter((s) => (s.status || '').toLowerCase() === 'unknown').length;
  const scholarshipsClosed = researchScholarships.filter((s) => (s.status || '').toLowerCase() === 'closed').length;
  const scholarshipsActive = researchScholarships.filter((s) => (s.status || '').toLowerCase() === 'active').length;
  return {
    universitiesTotal: researchUniversities.length,
    universitiesVerified: verified,
    universitiesPartial: partial,
    scholarshipsTotal: researchScholarships.length,
    scholarshipsActive,
    scholarshipsClosed,
    scholarshipsUnknown,
    learningResourcesTotal: researchLearningResources.length,
    checkedAt: '2026-10-11',
  };
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function findResearchUniversity(name: string): ResearchUniversity | undefined {
  const n = normalize(name);
  let best: ResearchUniversity | undefined;
  let bestScore = 0;
  for (const u of researchUniversities) {
    for (const cand of [u.common_name, u.hec_name]) {
      if (!cand) continue;
      const c = normalize(cand);
      if (c === n) return u;
      if (n.includes(c) || c.includes(n)) {
        const score = Math.min(c.length, n.length);
        if (score > bestScore) {
          best = u;
          bestScore = score;
        }
      }
    }
  }
  return best;
}

export function verificationForName(name: string): 'verified' | 'approximate' | 'unverified' | 'unavailable' {
  const hit = findResearchUniversity(name);
  const st = (hit?.verification_status || '').toLowerCase();
  if (st === 'verified') return 'verified';
  if (st === 'partial') return 'approximate';
  if (st === 'unverified') return 'unverified';
  return 'unavailable';
}
