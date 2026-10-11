import rawUniversityData from '../../data_v2.json';
import { query } from '@/lib/db';
import { getFields } from '@/lib/fields-data';
import { slugify } from '@/lib/slug';
import { computeAggregate, computeChance, getBenchmark } from '@/lib/predictor';
import { fetchAllFromDb, fetchPageFromDb } from '@/lib/university-query';
import type { PaginatedResult } from '@/lib/pagination';
import type {
  University,
  PredictorInput,
  PredictorResult,
  RawUniversityV2,
  RawCampus,
  RawProgram,
  RawAccreditation,
  RawEntryTest,
  RawScholarship,
  RawAcademicPolicy,
  RawFacility,
  RawCareerPath,
  RawRanking,
  RawReview,
  RawFaq,
  RawImportantLink,
  RawAdmission,
  RawFee,
  RawFacultyAcademics,
  RawStudentLife,
  RawHostel,
  RawTransport,
  RawPlacement
} from '@/lib/types';

export { getFields } from '@/lib/fields-data';

// ─── Simple In-Memory Cache ──────────────────────────────────────────────────
let cachedUniversities: University[] | null = null;
let cachedBundledUniversities: University[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

// Single-flight: concurrent callers (e.g. generateMetadata + the page component
// both call getUniversityBySlug) share one in-flight DB fetch instead of each
// firing 20 parallel queries against the pool, which exhausted it and caused
// connection timeouts.
let inFlightFetch: Promise<University[]> | null = null;

export function clearUniversitiesCache() {
  cachedUniversities = null;
  inFlightFetch = null;
}

function getBundledUniversities(): University[] {
  if (cachedBundledUniversities) {
    return cachedBundledUniversities;
  }

  const bundled = (rawUniversityData as { universities: RawUniversityV2[] }).universities.map(mapBundledUniversity);
  cachedBundledUniversities = bundled;
  return bundled;
}

function mapBundledUniversity(raw: RawUniversityV2): University {
  const bi = raw.basic_information;
  const ov = raw.university_overview;
  const campuses = (raw.campuses || []).map((campus) => ({
    campus_name: campus.campus_name,
    campus_type: campus.campus_type,
    address: campus.address,
    city: campus.city,
    province: campus.province,
    campus_size_acres: campus.campus_size_acres ?? null,
    virtual_tour_url: campus.virtual_tour_url,
    facilities: campus.facilities || []
  }));

  const programs = raw.programs || [];
  const scholarships = raw.scholarships || [];

  return {
    slug: bi.slug || slugify(bi.name),
    id: Number(raw.university_id),
    name: bi.name,
    shortName: bi.short_name || bi.name,
    logoUrl: bi.logo_url || null,
    officialWebsite: bi.official_website || '',
    admissionsPortal: bi.admissions_portal || '',
    phone: bi.phone || null,
    email: bi.email || null,
    address: bi.address || null,
    city: bi.city || 'Karachi',
    province: bi.province || 'Sindh',
    country: bi.country || 'Pakistan',
    yearEstablished: bi.year_established || null,
    charterAuthority: bi.charter_authority || null,
    hecStatus: bi.hec_status || null,
    universityType: bi.university_type || 'Private',
    overview: {
      history: ov?.history || null,
      mission: ov?.mission || null,
      vision: ov?.vision || null,
      reputation: ov?.reputation || null,
      nationalRanking: ov?.national_ranking || null,
      majorStrengths: ov?.major_strengths || [],
      notableAlumni: ov?.notable_alumni || [],
      keyAchievements: ov?.key_achievements || []
    },
    campuses,
    programs,
    accreditations: (bi.accreditations || []).map((accreditation) => ({
      body: accreditation.body,
      type: accreditation.type || null
    })),
    admissions: raw.admissions
      ? {
          admission_cycle: raw.admissions.admission_cycle,
          admission_months: raw.admissions.admission_months,
          application_start: raw.admissions.application_start || null,
          application_deadline: raw.admissions.application_deadline || null,
          result_date: raw.admissions.result_date || null,
          eligibility_criteria: raw.admissions.eligibility_criteria,
          required_documents: raw.admissions.required_documents || [],
          admission_process: raw.admissions.admission_process,
          merit_calculation_method: raw.admissions.merit_calculation_method,
          interview_requirement: raw.admissions.interview_requirement,
          entry_test_required: raw.admissions.entry_test_required,
          application_fee_pkr: raw.admissions.application_fee_pkr ?? null,
          online_application_url: raw.admissions.online_application_url
        }
      : null,
    entryTests: raw.entry_tests || [],
    fees: raw.fees || null,
    scholarships,
    academicPolicies: raw.academic_policies || [],
    facultyAcademics: raw.faculty_academics || null,
    studentLife: raw.student_life || null,
    facilities: raw.facilities || [],
    hostel: raw.hostel || null,
    transport: raw.transport || null,
    placements: raw.placements || null,
    careerPaths: raw.career_paths || [],
    rankings: raw.rankings || [],
    reviews: raw.reviews || [],
    faqs: raw.faqs || [],
    importantLinks: raw.important_links || [],
    programsCount: programs.length,
    dataCompleteness: raw.data_collection?.data_completeness_pct ?? 0
  };
}

export function getUniversities(): Promise<University[]> {
  const now = Date.now();
  if (cachedUniversities && (now - cacheTimestamp < CACHE_TTL)) {
    return Promise.resolve(cachedUniversities);
  }
  if (inFlightFetch) {
    return inFlightFetch;
  }
  inFlightFetch = fetchUniversities().finally(() => {
    inFlightFetch = null;
  });
  return inFlightFetch;
}

async function fetchUniversities(): Promise<University[]> {
  const now = Date.now();
  if (!process.env.DATABASE_URL) {
    const bundled = getBundledUniversities();
    cachedUniversities = bundled;
    cacheTimestamp = now;
    return bundled;
  }

  try {
    const result = await fetchAllFromDb();
    cachedUniversities = result;
    cacheTimestamp = now;
    return result;
  } catch (err) {
    // Warn, not error: handled fallback to the bundled dataset (e.g. when
    // PostgreSQL is not running). console.error during a Server Components
    // render is surfaced by the Next.js dev overlay as a page error.
    console.warn('Failed to fetch universities from DB, falling back to bundled data:', err);
    const bundled = getBundledUniversities();
    cachedUniversities = bundled;
    cacheTimestamp = now;
    return bundled;
  }
}

/**
 * Paginated university access for API routes.
 * Bypasses the full-list cache and hits the DB directly with cursor/limit.
 */
export async function getUniversitiesPage(
  cursor: number = 0,
  limit: number = 20
): Promise<PaginatedResult<University>> {
  if (!process.env.DATABASE_URL) {
    const all = getBundledUniversities();
    const start = all.findIndex(u => u.id > cursor);
    const slice = start === -1 ? [] : all.slice(start, start + limit);
    const nextCursor = start + limit < all.length
      ? String(slice[slice.length - 1]?.id ?? null)
      : null;
    return { data: slice, nextCursor, total: all.length, limit };
  }

  try {
    return await fetchPageFromDb(cursor, limit);
  } catch (err) {
    console.error('Failed to fetch universities page:', err);
    return { data: [], nextCursor: null, total: 0, limit };
  }
}


export async function getFeaturedUniversities(count = 6): Promise<University[]> {
  const list = await getUniversities();
  return list.filter((u) => u.city === 'Karachi').slice(0, count);
}

export async function getUniversityBySlug(slug: string): Promise<University | undefined> {
  const list = await getUniversities();
  return list.find((u) => u.slug === slug);
}

export async function getUniversitiesByCity(city: string): Promise<University[]> {
  const list = await getUniversities();
  return list.filter((u) => u.city.toLowerCase() === city.toLowerCase());
}

export async function searchUniversities(queryText: string): Promise<University[]> {
  const q = queryText.toLowerCase();
  const list = await getUniversities();
  return list.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.shortName.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.overview.majorStrengths.some((s) => s.toLowerCase().includes(q))
  );
}

export async function filterUniversities(filters: {
  city?: string;
  type?: string;
  hasScholarships?: boolean;
}): Promise<University[]> {
  const list = await getUniversities();
  return list.filter((u) => {
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

export async function predictAdmissions(input: PredictorInput): Promise<PredictorResult[]> {
  let universities = await filterUniversities({ city: input.city || undefined });

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

  const combinedScore = computeAggregate(input.matricPct, input.interPct);

  // Universities without a benchmark are skipped rather than scored against an
  // invented default cutoff. Benchmarks are rough estimates, not official merit.
  return universities
    .flatMap((u): PredictorResult[] => {
      const benchmark = getBenchmark(u.shortName);
      const chance = computeChance(combinedScore, u.shortName);
      if (benchmark === null || chance === null) return [];
      const diff = combinedScore - benchmark;

      let reason: string;
      if (chance === 'High') {
        reason = `Your aggregate (${combinedScore.toFixed(1)}%) is ${diff.toFixed(1)} points above our rough benchmark estimate (not an official cutoff).`;
      } else if (chance === 'Medium') {
        reason = `Your aggregate (${combinedScore.toFixed(1)}%) is near our rough benchmark estimate (not an official cutoff).`;
      } else {
        reason = `Your aggregate (${combinedScore.toFixed(1)}%) is ${Math.abs(diff).toFixed(1)} points below our rough benchmark estimate (not an official cutoff).`;
      }

      return [{
        universitySlug: u.slug,
        universityName: u.name,
        universityType: u.universityType,
        city: u.city,
        chance,
        score: combinedScore,
        reason,
      }];
    })
    .sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.chance] - order[b.chance] || b.score - a.score;
    });
}