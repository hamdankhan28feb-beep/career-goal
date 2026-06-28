// ─── Raw types from data_v2.json ───────────────────────────────────────────

export type RawCampus = {
  campus_name: string;
  campus_type?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  campus_size_acres?: number | null;
  virtual_tour_url?: string | null;
  facilities?: string[] | null;
};

export type RawAccreditation = {
  body: string;
  type?: string | null;
};

export type RawRanking = {
  ranking_name: string;
  ranking_category?: string | null;
  ranking_value?: string | null;
  ranking_note?: string | null;
};

export type RawImportantLink = {
  label: string;
  url: string;
  category?: string | null;
};

export type RawUniversityOverview = {
  history?: string | null;
  mission?: string | null;
  vision?: string | null;
  reputation?: string | null;
  national_ranking?: string | null;
  major_strengths?: string[] | null;
  notable_alumni?: string[] | null;
  key_achievements?: string[] | null;
};

export type RawUniversityBasicInfo = {
  name: string;
  short_name?: string | null;
  slug?: string | null;
  logo_url?: string | null;
  official_website?: string | null;
  admissions_portal?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postal_code?: string | null;
  coordinates?: string | null;
  year_established?: number | null;
  charter_authority?: string | null;
  hec_status?: string | null;
  university_type?: string | null;
  accreditations?: RawAccreditation[] | null;
  social_media?: Record<string, string> | null;
  virtual_tour_url?: string | null;
};

// Legacy v1 type (data.json)
export type RawUniversity = {
  name: string;
  short_name?: string;
  official_website?: string;
  admissions_portal?: string;
  location?: string;
  year_established?: string | number;
  hec_recognition?: string;
  accreditation?: string;
  university_type?: string;
  source_note?: string;
  campuses?: string[];
  program_highlights?: string[];
  source_urls?: string[];
};

// V2 university type
export type RawUniversityV2 = {
  university_id: number;
  basic_information: RawUniversityBasicInfo;
  university_overview?: RawUniversityOverview | null;
  campuses?: RawCampus[] | null;
  programs?: RawProgram[] | null;
  admissions?: RawAdmission | null;
  entry_tests?: RawEntryTest[] | null;
  fees?: RawFee | null;
  scholarships?: RawScholarship[] | null;
  academic_policies?: RawAcademicPolicy[] | null;
  faculty_academics?: RawFacultyAcademics | null;
  student_life?: RawStudentLife | null;
  facilities?: RawFacility[] | null;
  hostel?: RawHostel | null;
  transport?: RawTransport | null;
  placements?: RawPlacement | null;
  career_paths?: RawCareerPath[] | null;
  rankings?: RawRanking[] | null;
  reviews?: RawReview[] | null;
  faqs?: RawFaq[] | null;
  important_links?: RawImportantLink[] | null;
  data_collection?: {
    data_completeness_pct: number;
    scraping_priority_score: number;
    missing_fields: string[];
  } | null;
};

export type RawProgram = {
  program_name: string;
  degree_type?: string | null;
  duration_years?: number | null;
  duration_semesters?: number | null;
  credit_hours?: number | null;
  delivery_mode?: string | null;
  approx_merit_requirement?: string | null;
  eligibility_criteria?: string | null;
  open_merit_seats?: number | null;
  self_finance_seats?: number | null;
  total_seats?: number | null;
  accrediting_body?: string | null;
};

export type RawAdmission = {
  admission_cycle?: string | null;
  admission_months?: string | null;
  application_start?: string | null;
  application_deadline?: string | null;
  result_date?: string | null;
  eligibility_criteria?: string | null;
  required_documents?: string[] | null;
  admission_process?: string | null;
  merit_calculation_method?: string | null;
  interview_requirement?: string | null;
  entry_test_required?: boolean | null;
  application_fee_pkr?: number | null;
  online_application_url?: string | null;
};

export type RawEntryTest = {
  test_name?: string | null;
  test_type?: string | null;
  test_mode?: string | null;
  subjects_included?: string[] | null;
  total_marks?: number | null;
  passing_criteria?: string | null;
  passing_marks?: number | null;
  test_duration_min?: number | null;
  test_fee_pkr?: number | null;
  sample_pattern?: string | null;
  preparation_tips?: string | null;
};

export type RawFee = {
  fee_year?: number | null;
  admission_fee?: number | null;
  semester_fee?: number | null;
  credit_hour_fee?: number | null;
  hostel_fee_monthly?: number | null;
  transport_fee_monthly?: number | null;
  security_deposit?: number | null;
  approx_total_degree_cost?: number | null;
  fee_notes?: string | null;
};

export type RawScholarship = {
  scholarship_name?: string | null;
  scholarship_type?: string | null;
  eligibility?: string | null;
  coverage_percentage?: number | null;
  coverage_type?: string | null;
  annual_value_pkr?: number | null;
  renewable?: boolean | null;
  renewable_conditions?: string | null;
  seats_available?: number | null;
  external_body?: string | null;
  application_url?: string | null;
};

export type RawAcademicPolicy = {
  policy_category?: string | null;
  policy_name: string;
  policy_value?: string | null;
  min_cgpa?: number | null;
  min_attendance_pct?: number | null;
};

export type RawFacultyAcademics = {
  total_faculty_count?: number | null;
  phd_faculty_count?: number | null;
  student_faculty_ratio?: string | null;
  faculty_quality?: string | null;
  research_culture?: string | null;
  industry_exposure?: string | null;
  internship_support?: string | null;
  fyp_culture?: string | null;
};

export type RawStudentLife = {
  clubs?: string[] | null;
  societies?: string[] | null;
  annual_events?: string[] | null;
  sports_available?: string[] | null;
  student_council?: string | null;
  cultural_activities?: string | null;
};

export type RawFacility = {
  facility_category?: string | null;
  facility_name: string;
  description?: string | null;
  is_available?: boolean | null;
};

export type RawHostel = {
  hostel_availability?: boolean | null;
  hostel_quality?: string | null;
  gender?: string | null;
  monthly_fee_pkr?: number | null;
  meals_included?: boolean | null;
  ac_available?: boolean | null;
};

export type RawTransport = {
  transport_available?: boolean | null;
  bus_count?: number | null;
  routes?: string[] | null;
  monthly_fee_pkr?: number | null;
};

export type RawPlacement = {
  career_services_office?: string | null;
  placement_support?: string | null;
  placement_rate_pct?: number | null;
  industry_partnerships?: string[] | null;
  alumni_network?: string | null;
  alumni_count?: number | null;
  top_recruiters?: string[] | null;
};

export type RawCareerPath = {
  career_paths?: string[] | null;
  industries?: string[] | null;
  government_opportunities?: string[] | null;
  private_sector_opportunities?: string[] | null;
  freelancing_opportunities?: string | null;
  higher_education_options?: string[] | null;
  expected_salary_range_pkr?: string | null;
};

export type RawReview = {
  reviewer_type?: string | null;
  rating_overall?: number | null;
  rating_faculty?: number | null;
  rating_facilities?: number | null;
  rating_value_for_money?: number | null;
  positive_experiences?: string | null;
  common_complaints?: string | null;
  pros?: string[] | null;
  cons?: string[] | null;
};

export type RawFaq = {
  question: string;
  answer?: string | null;
  category?: string | null;
};

// ─── Normalised University type used across the app ─────────────────────────

export type University = {
  slug: string;
  id: number;
  name: string;
  shortName: string;
  logoUrl: string | null;
  officialWebsite: string;
  admissionsPortal: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
  province: string;
  country: string;
  yearEstablished: number | null;
  charterAuthority: string | null;
  hecStatus: string | null;
  universityType: string;
  // Overview
  overview: {
    history: string | null;
    mission: string | null;
    vision: string | null;
    reputation: string | null;
    nationalRanking: string | null;
    majorStrengths: string[];
    notableAlumni: string[];
    keyAchievements: string[];
  };
  // Relations
  campuses: RawCampus[];
  programs: RawProgram[];
  accreditations: RawAccreditation[];
  admissions: RawAdmission | null;
  entryTests: RawEntryTest[];
  fees: RawFee | null;
  scholarships: RawScholarship[];
  academicPolicies: RawAcademicPolicy[];
  facultyAcademics: RawFacultyAcademics | null;
  studentLife: RawStudentLife | null;
  facilities: RawFacility[];
  hostel: RawHostel | null;
  transport: RawTransport | null;
  placements: RawPlacement | null;
  careerPaths: RawCareerPath[];
  rankings: RawRanking[];
  reviews: RawReview[];
  faqs: RawFaq[];
  importantLinks: RawImportantLink[];
  // Computed
  programsCount: number;
  dataCompleteness: number;
};

// ─── Field Definition ────────────────────────────────────────────────────────

export type FieldSemester = {
  semester: number;
  courses: string[];
};

export type FieldDefinition = {
  slug: string;
  name: string;
  icon: string;
  category: string;
  overview: string;
  whyChoose: string[];
  skillsRequired: string[];
  degreeDuration: string;
  coreCourses: string[];
  electives: string[];
  difficultyLevel: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  industryDemand: 'Low' | 'Medium' | 'High' | 'Very High';
  futureScope: string;
  careerPaths: string[];
  governmentJobs: string[];
  privateSectorJobs: string[];
  freelancingOpportunities: string[];
  higherEducationOptions: string[];
  salaryRange: { min: number; max: number; currency: string };
  roadmap: FieldSemester[];
};

// ─── Quiz Types ──────────────────────────────────────────────────────────────

export type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  options: { value: number; label: string }[];
};

export type QuizResult = {
  field: string;
  slug: string;
  score: number;
  color: string;
};

// ─── Comparison Types ─────────────────────────────────────────────────────────

export type CompareUniversity = {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  type: string;
  campusCount: number;
  programCount: number;
  scholarshipCount: number;
  hasHostel: boolean;
  hasTransport: boolean;
  dataCompleteness: number;
};

// ─── Predictor Types ─────────────────────────────────────────────────────────

export type PredictorInput = {
  matricPct: number;
  interPct: number;
  city: string;
  budgetPkr: number;
};

export type PredictorResult = {
  universitySlug: string;
  universityName: string;
  universityType: string;
  city: string;
  chance: 'High' | 'Medium' | 'Low';
  score: number;
  reason: string;
};

// ─── Review Types ────────────────────────────────────────────────────────────

export type ReviewInput = {
  universitySlug: string;
  reviewerType: string;
  ratingOverall: number;
  ratingFaculty: number;
  ratingFacilities: number;
  ratingValueForMoney: number;
  positiveExperiences: string;
  commonComplaints: string;
  pros: string[];
  cons: string[];
};