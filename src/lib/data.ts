import rawUniversityData from '../../data_v2.json';
import { query } from '@/lib/db';
import { getFields } from '@/lib/fields-data';
import { slugify } from '@/lib/slug';
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

export function clearUniversitiesCache() {
  cachedUniversities = null;
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

export async function getUniversities(): Promise<University[]> {
  const now = Date.now();
  if (cachedUniversities && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedUniversities;
  }

  if (!process.env.DATABASE_URL) {
    const bundled = getBundledUniversities();
    cachedUniversities = bundled;
    cacheTimestamp = now;
    return bundled;
  }

  try {
    const unisRes = await query('SELECT * FROM universities WHERE is_active = true ORDER BY name ASC');
    const unis = unisRes.rows;

    if (unis.length === 0) return [];

    const [
      overviewsRes,
      campusesRes,
      programsRes,
      accreditationsRes,
      admissionsRes,
      entryTestsRes,
      feesRes,
      scholarshipsRes,
      policiesRes,
      facultyRes,
      studentLifeRes,
      facilitiesRes,
      hostelsRes,
      transportRes,
      placementsRes,
      careerPathsRes,
      rankingsRes,
      reviewsRes,
      faqsRes,
      linksRes
    ] = await Promise.all([
      query('SELECT * FROM university_overview WHERE is_active = true'),
      query('SELECT * FROM campuses WHERE is_active = true'),
      query('SELECT * FROM programs WHERE is_active = true'),
      query('SELECT * FROM accreditations WHERE is_active = true'),
      query('SELECT * FROM admissions WHERE is_active = true'),
      query('SELECT * FROM entry_tests WHERE is_active = true'),
      query('SELECT * FROM fees WHERE is_active = true'),
      query('SELECT * FROM scholarships WHERE is_active = true'),
      query('SELECT * FROM academic_policies WHERE is_active = true'),
      query('SELECT * FROM faculty_academics WHERE is_active = true'),
      query('SELECT * FROM student_life WHERE is_active = true'),
      query('SELECT * FROM campus_facilities WHERE is_available = true'),
      query('SELECT * FROM hostels WHERE is_active = true'),
      query('SELECT * FROM transport WHERE is_active = true'),
      query('SELECT * FROM placements WHERE is_active = true'),
      query('SELECT * FROM career_paths WHERE is_active = true'),
      query('SELECT * FROM rankings WHERE is_active = true'),
      query('SELECT * FROM reviews WHERE is_active = true'),
      query('SELECT * FROM faqs WHERE is_active = true'),
      query('SELECT * FROM important_links WHERE is_active = true')
    ]);

    const overviews = new Map(overviewsRes.rows.map(r => [String(r.university_id), r]));
    const campusesByUni = groupBy(campusesRes.rows, 'university_id');
    const programsByUni = groupBy(programsRes.rows, 'university_id');
    const accreditationsByUni = groupBy(accreditationsRes.rows, 'university_id');
    const admissionsByUni = new Map(admissionsRes.rows.map(r => [String(r.university_id), r]));
    const entryTestsByUni = groupBy(entryTestsRes.rows, 'university_id');
    const feesByUni = new Map(feesRes.rows.map(r => [String(r.university_id), r]));
    const scholarshipsByUni = groupBy(scholarshipsRes.rows, 'university_id');
    const policiesByUni = groupBy(policiesRes.rows, 'university_id');
    const facultyByUni = new Map(facultyRes.rows.map(r => [String(r.university_id), r]));
    const studentLifeByUni = new Map(studentLifeRes.rows.map(r => [String(r.university_id), r]));
    const facilitiesByUni = groupBy(facilitiesRes.rows, 'university_id');
    const hostelsByUni = new Map(hostelsRes.rows.map(r => [String(r.university_id), r]));
    const transportByUni = new Map(transportRes.rows.map(r => [String(r.university_id), r]));
    const placementsByUni = new Map(placementsRes.rows.map(r => [String(r.university_id), r]));
    const careerPathsByUni = groupBy(careerPathsRes.rows, 'university_id');
    const rankingsByUni = groupBy(rankingsRes.rows, 'university_id');
    const reviewsByUni = groupBy(reviewsRes.rows, 'university_id');
    const faqsByUni = groupBy(faqsRes.rows, 'university_id');
    const linksByUni = groupBy(linksRes.rows, 'university_id');

    const result = unis.map(u => {
      const uniIdStr = String(u.university_id);
      const ov = overviews.get(uniIdStr);
      const adm = admissionsByUni.get(uniIdStr);
      const fee = feesByUni.get(uniIdStr);
      const fac = facultyByUni.get(uniIdStr);
      const sl = studentLifeByUni.get(uniIdStr);
      const host = hostelsByUni.get(uniIdStr);
      const tr = transportByUni.get(uniIdStr);
      const plc = placementsByUni.get(uniIdStr);

      const mappedCampuses = (campusesByUni.get(uniIdStr) || []).map(c => ({
        campus_name: c.campus_name,
        campus_type: c.campus_type,
        address: c.address,
        city: c.city,
        province: c.province,
        campus_size_acres: c.campus_size_acres ? Number(c.campus_size_acres) : null,
        virtual_tour_url: c.virtual_tour_url,
        facilities: c.facilities || []
      })) as RawCampus[];

      const mappedPrograms = (programsByUni.get(uniIdStr) || []).map(p => ({
        program_name: p.program_name,
        degree_type: p.degree_type,
        duration_years: p.duration_years ? Number(p.duration_years) : null,
        duration_semesters: p.duration_semesters,
        credit_hours: p.credit_hours,
        delivery_mode: p.delivery_mode,
        approx_merit_requirement: p.approx_merit_requirement,
        eligibility_criteria: p.eligibility_criteria,
        open_merit_seats: p.open_merit_seats,
        self_finance_seats: p.self_finance_seats,
        total_seats: p.total_seats,
        accrediting_body: p.accrediting_body
      })) as RawProgram[];

      const mappedAccreditations = (accreditationsByUni.get(uniIdStr) || []).map(a => ({
        body: a.body_name,
        type: a.accreditation_type
      })) as RawAccreditation[];

      const mappedEntryTests = (entryTestsByUni.get(uniIdStr) || []).map(et => ({
        test_name: et.test_name,
        test_type: et.test_type,
        test_mode: et.test_mode,
        subjects_included: et.subjects_included || [],
        total_marks: et.total_marks,
        passing_criteria: et.passing_criteria,
        passing_marks: et.passing_marks,
        test_duration_min: et.test_duration_min,
        test_fee_pkr: et.test_fee_pkr ? Number(et.test_fee_pkr) : null,
        sample_pattern: et.sample_pattern,
        preparation_tips: et.preparation_tips
      })) as RawEntryTest[];

      const mappedScholarships = (scholarshipsByUni.get(uniIdStr) || []).map(s => ({
        scholarship_name: s.scholarship_name,
        scholarship_type: s.scholarship_type,
        eligibility: s.eligibility,
        coverage_percentage: s.coverage_percentage ? Number(s.coverage_percentage) : null,
        coverage_type: s.coverage_type,
        annual_value_pkr: s.annual_value_pkr ? Number(s.annual_value_pkr) : null,
        renewable: s.renewable,
        renewable_conditions: s.renewable_conditions,
        seats_available: s.seats_available,
        external_body: s.external_body,
        application_url: s.application_url
      })) as RawScholarship[];

      const mappedPolicies = (policiesByUni.get(uniIdStr) || []).map(p => ({
        policy_category: p.policy_category,
        policy_name: p.policy_name,
        policy_value: p.policy_value,
        min_cgpa: p.min_cgpa ? Number(p.min_cgpa) : null,
        min_attendance_pct: p.min_attendance_pct ? Number(p.min_attendance_pct) : null
      })) as RawAcademicPolicy[];

      const mappedFacilities = (facilitiesByUni.get(uniIdStr) || []).map(f => ({
        facility_category: f.facility_category,
        facility_name: f.facility_name,
        description: f.description,
        is_available: f.is_available
      })) as RawFacility[];

      const mappedCareerPaths = (careerPathsByUni.get(uniIdStr) || []).map(cp => ({
        career_paths: cp.career_paths || [],
        industries: cp.industries || [],
        government_opportunities: cp.government_opportunities || [],
        private_sector_opportunities: cp.private_sector_opportunities || [],
        freelancing_opportunities: cp.freelancing_opportunities,
        higher_education_options: cp.higher_education_options || [],
        expected_salary_range_pkr: cp.expected_salary_range_pkr
      })) as RawCareerPath[];

      const mappedRankings = (rankingsByUni.get(uniIdStr) || []).map(r => ({
        ranking_name: r.ranking_name,
        ranking_category: r.ranking_category,
        ranking_value: r.ranking_value,
        ranking_note: r.ranking_note
      })) as RawRanking[];

      const mappedReviews = (reviewsByUni.get(uniIdStr) || []).map(r => ({
        reviewer_type: r.reviewer_type,
        rating_overall: r.rating_overall ? Number(r.rating_overall) : null,
        rating_faculty: r.rating_faculty ? Number(r.rating_faculty) : null,
        rating_facilities: r.rating_facilities ? Number(r.rating_facilities) : null,
        rating_value_for_money: r.rating_value_for_money ? Number(r.rating_value_for_money) : null,
        positive_experiences: r.positive_experiences,
        common_complaints: r.common_complaints,
        pros: r.pros || [],
        cons: r.cons || []
      })) as RawReview[];

      const mappedFaqs = (faqsByUni.get(uniIdStr) || []).map(f => ({
        question: f.question,
        answer: f.answer,
        category: f.category
      })) as RawFaq[];

      const mappedLinks = (linksByUni.get(uniIdStr) || []).map(l => ({
        label: l.link_label,
        url: l.url,
        category: l.link_category
      })) as RawImportantLink[];

      return {
        slug: u.slug || '',
        id: Number(u.university_id),
        name: u.name,
        shortName: u.short_name || u.name,
        logoUrl: u.logo_url || null,
        officialWebsite: u.official_website || '',
        admissionsPortal: u.admissions_portal || '',
        phone: u.phone || null,
        email: u.email || null,
        address: u.address || null,
        city: u.city || 'Karachi',
        province: u.province || 'Sindh',
        country: u.country || 'Pakistan',
        yearEstablished: u.year_established || null,
        charterAuthority: u.charter_authority || null,
        hecStatus: u.hec_status || null,
        universityType: u.university_type || 'Private',
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
        campuses: mappedCampuses,
        programs: mappedPrograms,
        accreditations: mappedAccreditations,
        admissions: adm ? {
          admission_cycle: adm.admission_cycle,
          admission_months: adm.admission_months,
          application_start: adm.application_start ? new Date(adm.application_start).toISOString().split('T')[0] : null,
          application_deadline: adm.application_deadline ? new Date(adm.application_deadline).toISOString().split('T')[0] : null,
          result_date: adm.result_date ? new Date(adm.result_date).toISOString().split('T')[0] : null,
          eligibility_criteria: adm.eligibility_criteria,
          required_documents: adm.required_documents || [],
          admission_process: adm.admission_process,
          merit_calculation_method: adm.merit_calculation_method,
          interview_requirement: adm.interview_requirement,
          entry_test_required: adm.entry_test_required,
          application_fee_pkr: adm.application_fee_pkr ? Number(adm.application_fee_pkr) : null,
          online_application_url: adm.online_application_url
        } as RawAdmission : null,
        entryTests: mappedEntryTests,
        fees: fee ? {
          fee_year: fee.fee_year,
          admission_fee: fee.admission_fee ? Number(fee.admission_fee) : null,
          semester_fee: fee.semester_fee ? Number(fee.semester_fee) : null,
          credit_hour_fee: fee.credit_hour_fee ? Number(fee.credit_hour_fee) : null,
          hostel_fee_monthly: fee.hostel_fee_monthly ? Number(fee.hostel_fee_monthly) : null,
          transport_fee_monthly: fee.transport_fee_monthly ? Number(fee.transport_fee_monthly) : null,
          security_deposit: fee.security_deposit ? Number(fee.security_deposit) : null,
          approx_total_degree_cost: fee.approx_total_degree_cost ? Number(fee.approx_total_degree_cost) : null,
          fee_notes: fee.fee_notes
        } as RawFee : null,
        scholarships: mappedScholarships,
        academicPolicies: mappedPolicies,
        facultyAcademics: fac ? {
          total_faculty_count: fac.total_faculty_count,
          phd_faculty_count: fac.phd_faculty_count,
          student_faculty_ratio: fac.student_faculty_ratio,
          faculty_quality: fac.faculty_quality,
          research_culture: fac.research_culture,
          industry_exposure: fac.industry_exposure,
          internship_support: fac.internship_support,
          fyp_culture: fac.fyp_culture
        } as RawFacultyAcademics : null,
        studentLife: sl ? {
          clubs: sl.clubs || [],
          societies: sl.societies || [],
          annual_events: sl.annual_events || [],
          sports_available: sl.sports_available || [],
          student_council: sl.student_council,
          cultural_activities: sl.cultural_activities
        } as RawStudentLife : null,
        facilities: mappedFacilities,
        hostel: host ? {
          hostel_availability: host.hostel_availability,
          hostel_quality: host.hostel_quality,
          gender: host.gender,
          monthly_fee_pkr: host.monthly_fee_pkr ? Number(host.monthly_fee_pkr) : null,
          meals_included: host.meals_included,
          ac_available: host.ac_available
        } as RawHostel : null,
        transport: tr ? {
          transport_available: tr.transport_available,
          bus_count: tr.bus_count,
          routes: tr.routes || [],
          monthly_fee_pkr: tr.monthly_fee_pkr ? Number(tr.monthly_fee_pkr) : null
        } as RawTransport : null,
        placements: plc ? {
          career_services_office: plc.career_services_office,
          placement_support: plc.placement_support,
          placement_rate_pct: plc.placement_rate_pct ? Number(plc.placement_rate_pct) : null,
          industry_partnerships: plc.industry_partnerships || [],
          alumni_network: plc.alumni_network,
          alumni_count: plc.alumni_count,
          top_recruiters: plc.top_recruiters || []
        } as RawPlacement : null,
        careerPaths: mappedCareerPaths,
        rankings: mappedRankings,
        reviews: mappedReviews,
        faqs: mappedFaqs,
        importantLinks: mappedLinks,
        programsCount: mappedPrograms.length,
        dataCompleteness: 50 // Default/cached completeness metric
      };
    });

    cachedUniversities = result;
    cacheTimestamp = now;
    return result;
  } catch (err) {
    console.error('Failed to fetch universities from DB:', err);
    const bundled = getBundledUniversities();
    cachedUniversities = bundled;
    cacheTimestamp = now;
    return bundled;
  }
}

function groupBy(arr: any[], key: string): Map<string, any[]> {
  const map = new Map<string, any[]>();
  for (const item of arr) {
    const k = String(item[key]);
    if (!map.has(k)) {
      map.set(k, []);
    }
    map.get(k)!.push(item);
  }
  return map;
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

  return universities
    .map((u) => {
      const combinedScore = input.interPct * 0.6 + input.matricPct * 0.4;

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