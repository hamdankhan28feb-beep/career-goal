import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { getFields } from '@/lib/fields-data';
import type {
  RawUniversityV2,
  University,
  PredictorInput,
  PredictorResult,
} from '@/lib/types';

export { getFields } from '@/lib/fields-data';

// ─── Load/Save data_v2.json ───────────────────────────────────────────────────

type DataFileV2 = {
  metadata?: Record<string, unknown>;
  universities?: RawUniversityV2[];
};

export function loadRawUniversitiesV2(): RawUniversityV2[] {
  try {
    const filePath = path.join(process.cwd(), 'data_v2.json');
    const file = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(file) as DataFileV2;
    return Array.isArray(parsed.universities) ? parsed.universities : [];
  } catch {
    return [];
  }
}

export function saveRawUniversitiesV2(rawList: RawUniversityV2[]): void {
  const filePath = path.join(process.cwd(), 'data_v2.json');
  const data: DataFileV2 = {
    metadata: {
      dataset_name: "Pakistani University Profiles — v2",
      schema_version: "2.0",
      generated_on: new Date().toISOString().split('T')[0],
      source_policy: "Official university websites and official admissions portals only. Missing values are null — never fabricated.",
      coverage_note: "v2 extends v1 with 25 data categories. NULL fields await official scrape. data_completeness_pct reflects proportion of fields populated.",
      total_universities: rawList.length
    },
    universities: rawList
  };
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  // Clear the cache so that it reloads next time getUniversities() is called
  _universities = null;
}


// ─── Normalise v2 → University ────────────────────────────────────────────────

function normalizeV2(raw: RawUniversityV2): University {
  const bi = raw.basic_information;
  const ov = raw.university_overview;

  // Generate slug from short_name or name
  const slug =
    bi.slug ??
    (bi.short_name ?? bi.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return {
    slug,
    id: raw.university_id,
    name: bi.name,
    shortName: bi.short_name ?? bi.name,
    logoUrl: bi.logo_url ?? null,
    officialWebsite: bi.official_website ?? '',
    admissionsPortal: bi.admissions_portal ?? '',
    phone: bi.phone ?? null,
    email: bi.email ?? null,
    address: bi.address ?? null,
    city: bi.city ?? 'Karachi',
    province: bi.province ?? 'Sindh',
    country: bi.country ?? 'Pakistan',
    yearEstablished: bi.year_established ?? null,
    charterAuthority: bi.charter_authority ?? null,
    hecStatus: bi.hec_status ?? null,
    universityType: bi.university_type ?? 'Private',
    overview: {
      history: ov?.history ?? null,
      mission: ov?.mission ?? null,
      vision: ov?.vision ?? null,
      reputation: ov?.reputation ?? null,
      nationalRanking: ov?.national_ranking ?? null,
      majorStrengths: ov?.major_strengths ?? [],
      notableAlumni: ov?.notable_alumni ?? [],
      keyAchievements: ov?.key_achievements ?? [],
    },
    campuses: raw.campuses ?? [],
    programs: raw.programs ?? [],
    accreditations: bi.accreditations ?? [],
    admissions: raw.admissions ?? null,
    entryTests: raw.entry_tests ?? [],
    fees: raw.fees ?? null,
    scholarships: raw.scholarships ?? [],
    academicPolicies: raw.academic_policies ?? [],
    facultyAcademics: raw.faculty_academics ?? null,
    studentLife: raw.student_life ?? null,
    facilities: raw.facilities ?? [],
    hostel: raw.hostel ?? null,
    transport: raw.transport ?? null,
    placements: raw.placements ?? null,
    careerPaths: raw.career_paths ?? [],
    rankings: raw.rankings ?? [],
    reviews: raw.reviews ?? [],
    faqs: raw.faqs ?? [],
    importantLinks: raw.important_links ?? [],
    programsCount: (raw.programs ?? []).length,
    dataCompleteness: raw.data_collection?.data_completeness_pct ?? 20,
  };
}

// ─── Cached university list ───────────────────────────────────────────────────

let _universities: University[] | null = null;

export function getUniversities(): University[] {
  if (!_universities) {
    _universities = loadRawUniversitiesV2().map(normalizeV2);
  }
  return _universities;
}

export function getFeaturedUniversities(count = 6): University[] {
  return getUniversities()
    .filter((u) => u.city === 'Karachi')
    .slice(0, count);
}

export function getUniversityBySlug(slug: string): University | undefined {
  return getUniversities().find((u) => u.slug === slug);
}

export function getUniversitiesByCity(city: string): University[] {
  return getUniversities().filter(
    (u) => u.city.toLowerCase() === city.toLowerCase()
  );
}

export function searchUniversities(query: string): University[] {
  const q = query.toLowerCase();
  return getUniversities().filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.shortName.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.overview.majorStrengths.some((s) => s.toLowerCase().includes(q))
  );
}

export function filterUniversities(filters: {
  city?: string;
  type?: string;
  hasScholarships?: boolean;
}): University[] {
  return getUniversities().filter((u) => {
    if (filters.city && u.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.type && u.universityType.toLowerCase() !== filters.type.toLowerCase()) return false;
    if (filters.hasScholarships && u.scholarships.length === 0) return false;
    return true;
  });
}

export function getFieldBySlug(slug: string) {
  return getFields().find((f) => f.slug === slug);
}

// ─── Admission Predictor ──────────────────────────────────────────────────────

export function predictAdmissions(input: PredictorInput): PredictorResult[] {
  let universities = filterUniversities({ city: input.city || undefined });

  // Apply budget filtering if specified
  if (input.budgetPkr && input.budgetPkr > 0) {
    universities = universities.filter((u) => {
      const annualFee = u.fees?.semester_fee
        ? u.fees.semester_fee * 2
        : u.fees?.approx_total_degree_cost
        ? u.fees.approx_total_degree_cost / 4
        : 0;
      return annualFee === 0 || annualFee <= input.budgetPkr;
    });
  }

  return universities
    .map((u) => {
      // Simple scoring: inter% weighted 60%, matric% weighted 40%
      const combinedScore = input.interPct * 0.6 + input.matricPct * 0.4;

      // University toughness estimate based on type and known reputation
      const toughness: Record<string, number> = {
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
        'UoK': 60,
        SSUET: 62,
        IoBM: 70,
        'Iqra University': 60,
        'COMSATS': 72,
        'Ziauddin University': 65,
        'Indus University': 55,
        'Hamdard University': 60,
      };

      const requiredScore = toughness[u.shortName] ?? 65;
      const diff = combinedScore - requiredScore;

      let chance: 'High' | 'Medium' | 'Low';
      let reason: string;

      if (diff >= 10) {
        chance = 'High';
        reason = `Your aggregate (${combinedScore.toFixed(0)}%) exceeds the typical merit by ${diff.toFixed(0)}%.`;
      } else if (diff >= 0) {
        chance = 'Medium';
        reason = `Your aggregate (${combinedScore.toFixed(0)}%) is near the typical merit cutoff.`;
      } else {
        chance = 'Low';
        reason = `Your aggregate (${combinedScore.toFixed(0)}%) is below the typical cutoff by ${Math.abs(diff).toFixed(0)}%.`;
      }

      return {
        universitySlug: u.slug,
        universityName: u.name,
        universityType: u.universityType,
        city: u.city,
        chance,
        score: combinedScore,
        reason,
      };
    })
    .sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.chance] - order[b.chance] || b.score - a.score;
    });
}