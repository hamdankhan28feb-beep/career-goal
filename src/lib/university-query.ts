import { query } from '@/lib/db';
import type {
  University,
  RawCampus,
  RawProgram,
  RawAccreditation,
  RawEntryTest,
  RawScholarship,
  RawAcademicPolicy,
  RawFacultyAcademics,
  RawStudentLife,
  RawFacility,
  RawHostel,
  RawTransport,
  RawPlacement,
  RawCareerPath,
  RawRanking,
  RawReview,
  RawFaq,
  RawImportantLink,
  RawAdmission,
  RawFee
} from '@/lib/types';
import { DEFAULT_PAGE_LIMIT } from '@/lib/pagination';
import type { PaginatedResult } from '@/lib/pagination';

// ─── Single Query with JOINs ──────────────────────────────────────────────

const UNIVERSITY_QUERY = `
  SELECT
    u.university_id,
    u.name,
    u.short_name,
    u.slug,
    u.logo_url,
    u.official_website,
    u.admissions_portal,
    u.phone,
    u.email,
    u.address,
    u.city,
    u.province,
    u.country,
    u.year_established,
    u.charter_authority,
    u.hec_status,
    u.university_type,
    -- One-to-one: university_overview
    ov.history,
    ov.mission,
    ov.vision,
    ov.reputation,
    ov.national_ranking,
    ov.major_strengths,
    ov.notable_alumni,
    ov.key_achievements,
    -- One-to-one: admissions
    adm.admission_cycle,
    adm.admission_months,
    adm.application_start,
    adm.application_deadline,
    adm.result_date,
    adm.eligibility_criteria,
    adm.required_documents,
    adm.admission_process,
    adm.merit_calculation_method,
    adm.interview_requirement,
    adm.entry_test_required,
    adm.application_fee_pkr,
    adm.online_application_url,
    -- One-to-one: fees
    fee.fee_year,
    fee.admission_fee,
    fee.semester_fee,
    fee.credit_hour_fee,
    fee.hostel_fee_monthly,
    fee.transport_fee_monthly,
    fee.security_deposit,
    fee.approx_total_degree_cost,
    fee.fee_notes,
    -- One-to-one: faculty_academics
    fac.total_faculty_count,
    fac.phd_faculty_count,
    fac.student_faculty_ratio,
    fac.faculty_quality,
    fac.research_culture,
    fac.industry_exposure,
    fac.internship_support,
    fac.fyp_culture,
    -- One-to-one: student_life
    sl.clubs_and_societies,
    sl.events_and_festivals,
    sl.sports_facilities,
    sl.campus_culture,
    -- One-to-one: hostels
    host.availability AS hostel_availability,
    host.male_hostel_available,
    host.female_hostel_available,
    host.monthly_fee_pkr AS hostel_monthly_fee,
    host.mess_available,
    host.hostel_rules,
    -- One-to-one: transport
    tr.service_available,
    tr.routes,
    tr.monthly_fee_pkr AS transport_monthly_fee,
    -- One-to-one: placements
    plc.placement_office_url,
    plc.placement_rate_pct,
    plc.industry_partnerships,
    plc.alumni_count,
    plc.top_recruiters,
    plc.placement_notes,
    -- One-to-one: career_paths (UNIQUE constraint = one row per uni)
    cp.career_paths,
    cp.industries,
    cp.government_opportunities,
    cp.private_opportunities,
    cp.higher_education_paths,
    cp.freelancing_opportunities,
    cp.expected_salary_range_pkr,
    -- One-to-many: aggregated as JSON arrays
    COALESCE((
      SELECT json_agg(json_build_object(
        'campus_name', c.campus_name,
        'campus_type', c.campus_type,
        'address', c.address,
        'city', c.city,
        'province', c.province,
        'campus_size_acres', c.campus_size_acres,
        'virtual_tour_url', c.virtual_tour_url,
        'facilities', c.facilities
      ))
      FROM campuses c
      WHERE c.university_id = u.university_id AND c.is_active = true
    ), '[]'::json) AS campuses_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'program_name', p.program_name,
        'degree_type', p.degree_type,
        'duration_years', p.duration_years,
        'duration_semesters', p.duration_semesters,
        'credit_hours', p.credit_hours,
        'delivery_mode', p.delivery_mode,
        'approx_merit_requirement', p.approx_merit_requirement,
        'eligibility_criteria', p.eligibility_criteria,
        'open_merit_seats', p.open_merit_seats,
        'self_finance_seats', p.self_finance_seats,
        'total_seats', p.total_seats,
        'accrediting_body', p.accrediting_body
      ))
      FROM programs p
      WHERE p.university_id = u.university_id AND p.is_active = true
    ), '[]'::json) AS programs_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'body', a.body_name,
        'type', a.accreditation_type
      ))
      FROM accreditations a
      WHERE a.university_id = u.university_id AND a.is_active = true
    ), '[]'::json) AS accreditations_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'test_name', et.test_name,
        'test_type', et.test_type,
        'test_mode', et.test_mode,
        'subjects_included', et.subjects_included,
        'total_marks', et.total_marks,
        'passing_criteria', et.passing_criteria,
        'passing_marks', et.passing_marks,
        'test_duration_min', et.test_duration_min,
        'test_fee_pkr', et.test_fee_pkr,
        'sample_pattern', et.sample_pattern,
        'preparation_tips', et.preparation_tips
      ))
      FROM entry_tests et
      WHERE et.university_id = u.university_id AND et.is_active = true
    ), '[]'::json) AS entry_tests_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'scholarship_name', s.scholarship_name,
        'scholarship_type', s.scholarship_type,
        'eligibility', s.eligibility,
        'coverage_percentage', s.coverage_percentage,
        'coverage_type', s.coverage_type,
        'annual_value_pkr', s.annual_value_pkr,
        'renewable', s.renewable,
        'renewable_conditions', s.renewable_conditions,
        'seats_available', s.seats_available,
        'external_body', s.external_body,
        'application_url', s.application_url
      ))
      FROM scholarships s
      WHERE s.university_id = u.university_id AND s.is_active = true
    ), '[]'::json) AS scholarships_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'policy_category', ap.policy_category,
        'policy_name', ap.policy_name,
        'policy_value', ap.policy_value,
        'min_cgpa', ap.min_cgpa,
        'min_attendance_pct', ap.min_attendance_pct
      ))
      FROM academic_policies ap
      WHERE ap.university_id = u.university_id AND ap.is_active = true
    ), '[]'::json) AS policies_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'facility_category', cf.facility_category,
        'facility_name', cf.facility_name,
        'description', cf.description,
        'is_available', cf.is_available
      ))
      FROM campus_facilities cf
      WHERE cf.university_id = u.university_id AND cf.is_available = true
    ), '[]'::json) AS facilities_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'ranking_name', r.ranking_organization,
        'ranking_category', r.ranking_category,
        'ranking_value', r.ranking_value
      ))
      FROM rankings r
      WHERE r.university_id = u.university_id AND r.is_active = true
    ), '[]'::json) AS rankings_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'reviewer_type', rev.reviewer_type,
        'rating_overall', rev.rating_overall,
        'rating_faculty', rev.rating_faculty,
        'rating_facilities', rev.rating_facilities,
        'rating_value_for_money', rev.rating_value_for_money,
        'positive_experiences', rev.positive_experiences,
        'common_complaints', rev.common_complaints,
        'pros', rev.pros,
        'cons', rev.cons
      ))
      FROM reviews rev
      WHERE rev.university_id = u.university_id AND rev.is_active = true
    ), '[]'::json) AS reviews_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'question', f.question,
        'answer', f.answer,
        'category', f.category
      ))
      FROM faqs f
      WHERE f.university_id = u.university_id AND f.is_active = true
    ), '[]'::json) AS faqs_json,
    COALESCE((
      SELECT json_agg(json_build_object(
        'label', il.label,
        'url', il.url,
        'category', il.link_category,
        'description', il.description,
        'is_unofficial', il.is_unofficial
      ))
      FROM important_links il
      WHERE il.university_id = u.university_id AND il.is_active = true
    ), '[]'::json) AS links_json
  FROM universities u
  LEFT JOIN university_overview ov ON u.university_id = ov.university_id AND ov.is_active = true
  LEFT JOIN admissions adm ON u.university_id = adm.university_id AND adm.is_active = true
  LEFT JOIN fees fee ON u.university_id = fee.university_id AND fee.is_active = true
  LEFT JOIN faculty_academics fac ON u.university_id = fac.university_id AND fac.is_active = true
  LEFT JOIN student_life sl ON u.university_id = sl.university_id AND sl.is_active = true
  LEFT JOIN hostels host ON u.university_id = host.university_id AND host.is_active = true
  LEFT JOIN transport tr ON u.university_id = tr.university_id AND tr.is_active = true
  LEFT JOIN placements plc ON u.university_id = plc.university_id AND plc.is_active = true
  LEFT JOIN career_paths cp ON u.university_id = cp.university_id AND cp.is_active = true
  WHERE u.is_active = true
  ORDER BY u.name ASC
`;

// ─── Helper Functions ─────────────────────────────────────────────────────

function num(val: any): number | null {
  if (val == null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function json<T>(val: any, fallback: T): T {
  if (val == null) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

function mapRow(r: any): University {
  const campuses = json<RawCampus[]>(r.campuses_json, []);
  const programs = json<RawProgram[]>(r.programs_json, []);
  const accreditations = json<RawAccreditation[]>(r.accreditations_json, []);
  const entryTests = json<RawEntryTest[]>(r.entry_tests_json, []);
  const scholarships = json<RawScholarship[]>(r.scholarships_json, []);
  const policies = json<RawAcademicPolicy[]>(r.policies_json, []);
  const facilities = json<RawFacility[]>(r.facilities_json, []);
  const rankings = json<RawRanking[]>(r.rankings_json, []);
  const reviews = json<RawReview[]>(r.reviews_json, []);
  const faqs = json<RawFaq[]>(r.faqs_json, []);
  const links = json<RawImportantLink[]>(r.links_json, []);

  const admissions: RawAdmission | null = r.admission_cycle ? {
    admission_cycle: r.admission_cycle,
    admission_months: r.admission_months,
    application_start: r.application_start ? new Date(r.application_start).toISOString().split('T')[0] : null,
    application_deadline: r.application_deadline ? new Date(r.application_deadline).toISOString().split('T')[0] : null,
    result_date: r.result_date ? new Date(r.result_date).toISOString().split('T')[0] : null,
    eligibility_criteria: r.eligibility_criteria,
    required_documents: r.required_documents || [],
    admission_process: r.admission_process,
    merit_calculation_method: r.merit_calculation_method,
    interview_requirement: r.interview_requirement,
    entry_test_required: r.entry_test_required,
    application_fee_pkr: num(r.application_fee_pkr),
    online_application_url: r.online_application_url
  } : null;

  const fees: RawFee | null = r.fee_year ? {
    fee_year: num(r.fee_year),
    admission_fee: num(r.admission_fee),
    semester_fee: num(r.semester_fee),
    credit_hour_fee: num(r.credit_hour_fee),
    hostel_fee_monthly: num(r.hostel_fee_monthly),
    transport_fee_monthly: num(r.transport_monthly_fee),
    security_deposit: num(r.security_deposit),
    approx_total_degree_cost: num(r.approx_total_degree_cost),
    fee_notes: r.fee_notes
  } : null;

  const facultyAcademics: RawFacultyAcademics | null = r.total_faculty_count ? {
    total_faculty_count: num(r.total_faculty_count),
    phd_faculty_count: num(r.phd_faculty_count),
    student_faculty_ratio: r.student_faculty_ratio,
    faculty_quality: r.faculty_quality,
    research_culture: r.research_culture,
    industry_exposure: r.industry_exposure,
    internship_support: r.internship_support,
    fyp_culture: r.fyp_culture
  } : null;

  const studentLife: RawStudentLife | null = r.clubs_and_societies ? {
    clubs: r.clubs_and_societies || [],
    societies: [],
    annual_events: r.events_and_festivals || [],
    sports_available: r.sports_facilities || [],
    student_council: r.campus_culture || null,
    cultural_activities: null
  } : null;

  const hostel: RawHostel | null = r.hostel_availability != null ? {
    hostel_availability: /^(yes|available|true|y)$/i.test(String(r.hostel_availability)),
    hostel_quality: r.hostel_rules || null,
    gender: r.male_hostel_available == null && r.female_hostel_available == null
      ? null
      : r.male_hostel_available && r.female_hostel_available
      ? 'Both'
      : r.male_hostel_available
      ? 'Male'
      : 'Female',
    monthly_fee_pkr: num(r.hostel_monthly_fee),
    meals_included: r.mess_available ?? null,
    ac_available: null
  } : null;

  const transport: RawTransport | null = r.service_available != null ? {
    transport_available: r.service_available,
    bus_count: null,
    routes: r.routes || [],
    monthly_fee_pkr: num(r.transport_monthly_fee)
  } : null;

  const placements: RawPlacement | null = r.placement_office_url ? {
    career_services_office: r.placement_office_url || null,
    placement_support: r.placement_notes || null,
    placement_rate_pct: num(r.placement_rate_pct),
    industry_partnerships: r.industry_partnerships || [],
    alumni_network: null,
    alumni_count: num(r.alumni_count),
    top_recruiters: r.top_recruiters || []
  } : null;

  const careerPaths: RawCareerPath[] = r.career_paths ? [{
    career_paths: r.career_paths || [],
    industries: r.industries || [],
    government_opportunities: r.government_opportunities || [],
    private_sector_opportunities: r.private_opportunities || [],
    freelancing_opportunities: r.freelancing_opportunities,
    higher_education_options: r.higher_education_paths || [],
    expected_salary_range_pkr: r.expected_salary_range_pkr
  }] : [];

  // Calculate data completeness dynamically
  const checks = [
    !!r.history,
    campuses.length > 0,
    programs.length > 0,
    !!admissions,
    entryTests.length > 0,
    !!fees,
    scholarships.length > 0,
    !!facultyAcademics,
    !!studentLife,
    facilities.length > 0,
    !!hostel,
    !!transport,
    !!placements,
    careerPaths.length > 0,
    rankings.length > 0,
    reviews.length > 0
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return {
    slug: r.slug || '',
    id: Number(r.university_id),
    name: r.name,
    shortName: r.short_name || r.name,
    logoUrl: r.logo_url || null,
    officialWebsite: r.official_website || '',
    admissionsPortal: r.admissions_portal || '',
    phone: r.phone || null,
    email: r.email || null,
    address: r.address || null,
    city: r.city || 'Karachi',
    province: r.province || 'Sindh',
    country: r.country || 'Pakistan',
    yearEstablished: num(r.year_established),
    charterAuthority: r.charter_authority || null,
    hecStatus: r.hec_status || null,
    universityType: r.university_type || 'Private',
    overview: {
      history: r.history || null,
      mission: r.mission || null,
      vision: r.vision || null,
      reputation: r.reputation || null,
      nationalRanking: r.national_ranking || null,
      majorStrengths: r.major_strengths || [],
      notableAlumni: r.notable_alumni || [],
      keyAchievements: r.key_achievements || []
    },
    campuses,
    programs,
    accreditations,
    admissions,
    entryTests,
    fees,
    scholarships,
    academicPolicies: policies,
    facultyAcademics,
    studentLife,
    facilities,
    hostel,
    transport,
    placements,
    careerPaths,
    rankings,
    reviews,
    faqs,
    importantLinks: links,
    programsCount: programs.length,
    dataCompleteness: completeness
  };
}

// ─── Exported Functions ───────────────────────────────────────────────────

export async function fetchAllFromDb(): Promise<University[]> {
  const res = await query(UNIVERSITY_QUERY);
  return res.rows.map(mapRow);
}

export async function fetchPageFromDb(
  cursor: number = 0,
  limit: number = DEFAULT_PAGE_LIMIT
): Promise<PaginatedResult<University>> {
  // Fetch one extra to determine if there are more results
  const paginatedQuery = `
    ${UNIVERSITY_QUERY}
    AND u.university_id > $1
    LIMIT $2
  `;
  
  const res = await query(paginatedQuery, [cursor, limit + 1]);
  const rows = res.rows;
  
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && data.length > 0 
    ? String(data[data.length - 1].university_id)
    : null;

  // Get total count for pagination metadata
  const countRes = await query(
    'SELECT COUNT(*) FROM universities WHERE is_active = true AND university_id > $1',
    [cursor]
  );
  const total = Number(countRes.rows[0].count);

  return {
    data: data.map(mapRow),
    nextCursor,
    total,
    limit
  };
}

export async function fetchBySlugFromDb(slug: string): Promise<University | undefined> {
  const slugQuery = `
    ${UNIVERSITY_QUERY}
    AND u.slug = $1
  `;
  
  const res = await query(slugQuery, [slug]);
  if (res.rows.length === 0) return undefined;
  return mapRow(res.rows[0]);
}
