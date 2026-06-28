-- =============================================================================
-- UNIVERSITY DATABASE  —  schema_v2.sql
-- PostgreSQL optimised design  |  Source policy: official sources only
-- Generated: 2026-06-25
-- NOTE: This is an ADDITIVE migration. Run migration_v1_to_v2.sql FIRST
--       if upgrading from schema.sql (v1).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONS & AUTO-TIMESTAMP TRIGGER
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search

-- Reusable trigger function to keep updated_at current
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE university_type_enum AS ENUM ('Public','Private','Semi-Government','Federal','Provincial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE degree_type_enum AS ENUM ('Certificate','Diploma','Associate','BS','BE','MBBS','BDS','BArch','LLB','MS','MBA','MPhil','MD','PhD','PGD','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_mode_enum AS ENUM ('On-Campus','Online','Hybrid','ODL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE facility_category_enum AS ENUM ('Library','Laboratory','Cafeteria','Mosque','Medical','Sports','WiFi','Parking','ATM','Printing','Auditorium','Gymnasium','Swimming Pool','Transport','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE policy_category_enum AS ENUM ('Grading','CGPA','Attendance','Academic Warning','Probation','Repeat Course','Graduation','Dress Code','Disciplinary','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scholarship_type_enum AS ENUM ('Merit','Need-Based','Sports','HEC','External','International','Alumni','Military','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ranking_category_enum AS ENUM ('National','International','Subject-Specific','HEC','QS','THE','Webometrics','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reviewer_type_enum AS ENUM ('Current Student','Alumni','Faculty','Employer','Parent','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campus_type_enum AS ENUM ('Main','City','Satellite','Medical','Health Sciences','Research','Online','IPP','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. CORE — UNIVERSITIES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universities (
    university_id       BIGSERIAL PRIMARY KEY,
    -- Basic Identification
    name                TEXT NOT NULL,
    short_name          TEXT,
    slug                TEXT UNIQUE,               -- URL-friendly key e.g. "fast-nuces-karachi"
    logo_url            TEXT,
    -- Contact & Web
    official_website    TEXT,
    admissions_portal   TEXT,
    phone               TEXT,
    email               TEXT,
    -- Location (normalised)
    address             TEXT,
    city                TEXT,
    province            TEXT,
    country             TEXT NOT NULL DEFAULT 'Pakistan',
    postal_code         TEXT,
    coordinates         TEXT,                      -- "lat,lng" string (use POINT if PostGIS)
    -- Establishment
    year_established    INTEGER,
    charter_authority   TEXT,                      -- e.g. "Sindh Govt", "Federal Govt"
    -- Recognition & Type
    hec_status          TEXT,                      -- Clean HEC status only
    university_type     university_type_enum,
    -- Overview
    history             TEXT,
    mission             TEXT,
    vision              TEXT,
    reputation_note     TEXT,
    major_strengths     TEXT[],
    -- Social Media
    social_media        JSONB,                     -- {"facebook":"url","twitter":"url",...}
    virtual_tour_url    TEXT,
    -- Metadata
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    source_note         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_universities
  BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 3. ACCREDITATIONS  (replaces single accreditation text column)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accreditations (
    accreditation_id    BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    body_name           TEXT NOT NULL,             -- e.g. "NBEAC", "PEC", "ISO"
    accreditation_type  TEXT,                      -- e.g. "W Category", "ISO 9001:2015"
    scope               TEXT,                      -- program/institution level
    valid_until         DATE,
    certificate_url     TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_accreditations
  BEFORE UPDATE ON accreditations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 4. UNIVERSITY OVERVIEW
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS university_overview (
    overview_id         BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    history             TEXT,
    mission             TEXT,
    vision              TEXT,
    reputation          TEXT,
    national_ranking    TEXT,
    major_strengths     TEXT[],
    notable_alumni      TEXT[],
    key_achievements    TEXT[],
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_university_overview
  BEFORE UPDATE ON university_overview
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 5. CAMPUSES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campuses (
    campus_id           BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_name         TEXT NOT NULL,
    campus_type         campus_type_enum,
    address             TEXT,
    city                TEXT,
    province            TEXT,
    coordinates         TEXT,
    campus_size_acres   NUMERIC(8,2),
    phone               TEXT,
    email               TEXT,
    established_year    INTEGER,
    virtual_tour_url    TEXT,
    map_embed_url       TEXT,
    facilities          TEXT[],                    -- quick list; detailed in campus_facilities
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_campuses
  BEFORE UPDATE ON campuses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 6. CAMPUS FACILITIES  (detailed per-campus facility rows)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campus_facilities (
    cf_id               BIGSERIAL PRIMARY KEY,
    campus_id           BIGINT NOT NULL REFERENCES campuses(campus_id) ON DELETE CASCADE,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    facility_category   facility_category_enum,
    facility_name       TEXT NOT NULL,
    description         TEXT,
    capacity            TEXT,
    operating_hours     TEXT,
    is_available        BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    source_urls         JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_campus_facilities
  BEFORE UPDATE ON campus_facilities
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 7. DEPARTMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    department_id       BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    department_name     TEXT NOT NULL,
    faculty_name        TEXT,                      -- parent faculty/school name
    chairperson         TEXT,
    established_year    INTEGER,
    department_website  TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_departments
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 8. PROGRAMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programs (
    program_id          BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    department_id       BIGINT REFERENCES departments(department_id) ON DELETE SET NULL,
    program_name        TEXT NOT NULL,
    degree_type         degree_type_enum,
    duration_years      NUMERIC(3,1),
    duration_semesters  INTEGER,
    credit_hours        INTEGER,
    delivery_mode       delivery_mode_enum DEFAULT 'On-Campus',
    language            TEXT DEFAULT 'English',
    approx_merit_requirement TEXT,
    eligibility_criteria TEXT,
    open_merit_seats    INTEGER,
    self_finance_seats  INTEGER,
    total_seats         INTEGER,
    accrediting_body    TEXT,
    program_status      TEXT DEFAULT 'Active',
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_programs
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 9. ADMISSIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admissions (
    admission_id        BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    admission_cycle     TEXT,                      -- e.g. "Fall 2025", "Spring 2026"
    admission_months    TEXT,
    application_start   DATE,
    application_deadline DATE,
    result_date         DATE,
    eligibility_criteria TEXT,
    required_documents  TEXT[],
    admission_process   TEXT,
    merit_calculation_method TEXT,
    interview_requirement TEXT,
    entry_test_required BOOLEAN DEFAULT FALSE,
    application_fee_pkr NUMERIC(10,2),
    online_application_url TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_admissions
  BEFORE UPDATE ON admissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 10. ENTRY TESTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entry_tests (
    entry_test_id       BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    test_name           TEXT,
    test_type           TEXT,                      -- "Own", "NAT", "SAT", "MDCAT", "NTS"
    test_mode           TEXT,                      -- "Online", "Paper-Based"
    subjects_included   TEXT[],
    marks_distribution  JSONB,                     -- {"Math":60,"English":40,...}
    total_marks         INTEGER,
    passing_criteria    TEXT,
    passing_marks       INTEGER,
    test_duration_min   INTEGER,
    test_fee_pkr        NUMERIC(8,2),
    test_website_url    TEXT,
    registration_deadline DATE,
    sample_pattern      TEXT,
    preparation_tips    TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_entry_tests
  BEFORE UPDATE ON entry_tests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 11. FEES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fees (
    fee_id              BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    program_id          BIGINT REFERENCES programs(program_id) ON DELETE SET NULL,
    campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    fee_year            INTEGER,                   -- e.g. 2025
    fee_currency        TEXT NOT NULL DEFAULT 'PKR',
    admission_fee       NUMERIC(12,2),
    semester_fee        NUMERIC(12,2),
    credit_hour_fee     NUMERIC(10,2),
    lab_fee             NUMERIC(10,2),
    exam_fee            NUMERIC(10,2),
    hostel_fee_monthly  NUMERIC(10,2),
    transport_fee_monthly NUMERIC(10,2),
    security_deposit    NUMERIC(10,2),
    alumni_fee          NUMERIC(10,2),
    approx_total_degree_cost NUMERIC(14,2),
    fee_notes           TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_fees
  BEFORE UPDATE ON fees
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 12. SCHOLARSHIPS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarships (
    scholarship_id      BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    scholarship_name    TEXT,
    scholarship_type    scholarship_type_enum,
    eligibility         TEXT,
    coverage_percentage NUMERIC(5,2),             -- 0–100
    coverage_type       TEXT,                      -- "Full Tuition","50% Tuition","Stipend"
    annual_value_pkr    NUMERIC(12,2),
    renewable           BOOLEAN DEFAULT FALSE,
    renewable_conditions TEXT,
    seats_available     INTEGER,
    application_deadline DATE,
    external_body       TEXT,
    application_url     TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_scholarships
  BEFORE UPDATE ON scholarships
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 13. ACADEMIC POLICIES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_policies (
    policy_id           BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    policy_category     policy_category_enum,
    policy_name         TEXT NOT NULL,
    policy_value        TEXT,
    min_cgpa            NUMERIC(3,2),
    min_attendance_pct  NUMERIC(5,2),
    probation_cgpa      NUMERIC(3,2),
    max_repeat_attempts INTEGER,
    graduation_min_cgpa NUMERIC(3,2),
    effective_date      DATE,
    document_url        TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_academic_policies
  BEFORE UPDATE ON academic_policies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 14. FACULTY & ACADEMICS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_academics (
    faculty_acad_id     BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    department_id       BIGINT REFERENCES departments(department_id) ON DELETE SET NULL,
    total_faculty_count INTEGER,
    phd_faculty_count   INTEGER,
    student_faculty_ratio TEXT,
    faculty_quality     TEXT,
    qualification_levels TEXT,
    research_culture    TEXT,
    publications_count  INTEGER,
    research_grants     TEXT,
    notable_faculty     JSONB,                     -- [{"name":"Dr. X","specialisation":"AI"}]
    lab_facilities      TEXT,
    industry_exposure   TEXT,
    internship_support  TEXT,
    fyp_culture         TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_faculty_academics
  BEFORE UPDATE ON faculty_academics
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 15. STUDENT LIFE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_life (
    student_life_id     BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    clubs               TEXT[],
    societies           TEXT[],
    annual_events       TEXT[],
    sports_available    TEXT[],
    sports_achievements TEXT,
    networking_opportunities TEXT,
    student_council     TEXT,
    cultural_activities TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_student_life
  BEFORE UPDATE ON student_life
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 16. HOSTELS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostels (
    hostel_id           BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    hostel_name         TEXT,
    gender              TEXT,                      -- "Boys","Girls","Mixed"
    hostel_availability BOOLEAN DEFAULT FALSE,
    hostel_quality      TEXT,
    boys_capacity       INTEGER,
    girls_capacity      INTEGER,
    monthly_fee_pkr     NUMERIC(10,2),
    meals_included      BOOLEAN DEFAULT FALSE,
    ac_available        BOOLEAN DEFAULT FALSE,
    wifi_available      BOOLEAN DEFAULT TRUE,
    warden_contact      TEXT,
    address             TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_hostels
  BEFORE UPDATE ON hostels
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 17. TRANSPORT
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transport (
    transport_id        BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
    transport_available BOOLEAN DEFAULT FALSE,
    bus_count           INTEGER,
    ac_buses            BOOLEAN DEFAULT FALSE,
    routes              TEXT[],
    route_map_url       TEXT,
    pickup_times        TEXT,
    monthly_fee_pkr     NUMERIC(10,2),
    contact             TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_transport
  BEFORE UPDATE ON transport
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 18. PLACEMENTS / CAREER SERVICES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placements (
    placement_id        BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    career_services_office TEXT,
    placement_office_url TEXT,
    internship_opportunities TEXT,
    placement_support   TEXT,
    placement_rate_pct  NUMERIC(5,2),
    avg_starting_salary_pkr NUMERIC(12,2),
    industry_partnerships TEXT[],
    alumni_network      TEXT,
    alumni_count        INTEGER,
    linkedin_alumni_url TEXT,
    top_recruiters      TEXT[],
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_placements
  BEFORE UPDATE ON placements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 19. CAREER PATHS  (per program — FK enforced)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_paths (
    career_path_id      BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    program_id          BIGINT REFERENCES programs(program_id) ON DELETE SET NULL,
    career_paths        TEXT[],
    industries          TEXT[],
    government_opportunities TEXT[],
    private_sector_opportunities TEXT[],
    freelancing_opportunities TEXT,
    international_opportunities TEXT,
    higher_education_options TEXT[],
    certifications_recommended TEXT[],
    expected_salary_range_pkr TEXT,               -- "60,000 – 120,000 PKR/month"
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_career_paths
  BEFORE UPDATE ON career_paths
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 20. RANKINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rankings (
    ranking_id          BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    ranking_name        TEXT,
    ranking_category    ranking_category_enum,
    ranking_value       TEXT,
    ranking_year        INTEGER,
    ranking_note        TEXT,
    ranking_url         TEXT,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_rankings
  BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 21. REVIEWS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    review_id           BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    reviewer_type       reviewer_type_enum,
    review_date         DATE,
    rating_overall      NUMERIC(2,1) CHECK (rating_overall BETWEEN 1 AND 5),
    rating_faculty      NUMERIC(2,1) CHECK (rating_faculty BETWEEN 1 AND 5),
    rating_facilities   NUMERIC(2,1) CHECK (rating_facilities BETWEEN 1 AND 5),
    rating_value_for_money NUMERIC(2,1) CHECK (rating_value_for_money BETWEEN 1 AND 5),
    positive_experiences TEXT,
    common_complaints   TEXT,
    faculty_feedback    TEXT,
    campus_culture_feedback TEXT,
    pros                TEXT[],
    cons                TEXT[],
    verified            BOOLEAN DEFAULT FALSE,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_reviews
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 22. FAQs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faqs (
    faq_id              BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    question            TEXT NOT NULL,
    answer              TEXT,
    category            TEXT,                      -- "Admissions","Fees","Hostel" etc.
    sort_order          INTEGER DEFAULT 0,
    source_urls         JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_faqs
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 23. IMPORTANT LINKS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS important_links (
    link_id             BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    link_label          TEXT NOT NULL,
    url                 TEXT NOT NULL,
    link_category       TEXT,                      -- "Admissions","Fee Structure","Scholarships"
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_important_links
  BEFORE UPDATE ON important_links
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 24. DATA COLLECTION CHECKLIST  (Phase 4)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_collection_checklist (
    checklist_id        BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    field_group         TEXT NOT NULL,             -- "Basic Info","Admissions","Fees" etc.
    field_name          TEXT NOT NULL,
    is_collected        BOOLEAN DEFAULT FALSE,
    collected_value     TEXT,
    collection_source   TEXT,
    last_verified       DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_data_collection_checklist
  BEFORE UPDATE ON data_collection_checklist
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- 25. SCRAPING TARGETS  (Phase 4)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scraping_targets (
    target_id           BIGSERIAL PRIMARY KEY,
    university_id       BIGINT NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
    target_url          TEXT NOT NULL,
    data_type           TEXT,                      -- "Admissions","Fee Structure","Programs"
    priority_score      INTEGER DEFAULT 5,         -- 1 (low) to 10 (highest)
    last_scraped        TIMESTAMPTZ,
    scrape_status       TEXT DEFAULT 'Pending',    -- "Pending","Success","Failed","Blocked"
    data_completeness_pct NUMERIC(5,2),
    error_note          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_scraping_targets
  BEFORE UPDATE ON scraping_targets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- universities
CREATE INDEX IF NOT EXISTS idx_universities_slug         ON universities(slug);
CREATE INDEX IF NOT EXISTS idx_universities_type         ON universities(university_type);
CREATE INDEX IF NOT EXISTS idx_universities_city         ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_province     ON universities(province);
CREATE INDEX IF NOT EXISTS idx_universities_name_trgm    ON universities USING GIN (name gin_trgm_ops);

-- accreditations
CREATE INDEX IF NOT EXISTS idx_accreditations_uni        ON accreditations(university_id);

-- university_overview
CREATE INDEX IF NOT EXISTS idx_overview_uni              ON university_overview(university_id);

-- campuses
CREATE INDEX IF NOT EXISTS idx_campuses_uni              ON campuses(university_id);
CREATE INDEX IF NOT EXISTS idx_campuses_city             ON campuses(city);

-- campus_facilities
CREATE INDEX IF NOT EXISTS idx_cf_campus                 ON campus_facilities(campus_id);
CREATE INDEX IF NOT EXISTS idx_cf_category               ON campus_facilities(facility_category);

-- departments
CREATE INDEX IF NOT EXISTS idx_departments_uni           ON departments(university_id);
CREATE INDEX IF NOT EXISTS idx_departments_campus        ON departments(campus_id);

-- programs
CREATE INDEX IF NOT EXISTS idx_programs_uni              ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_campus           ON programs(campus_id);
CREATE INDEX IF NOT EXISTS idx_programs_dept             ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_programs_degree_type      ON programs(degree_type);
CREATE INDEX IF NOT EXISTS idx_programs_name_trgm        ON programs USING GIN (program_name gin_trgm_ops);

-- admissions
CREATE INDEX IF NOT EXISTS idx_admissions_uni            ON admissions(university_id);
CREATE INDEX IF NOT EXISTS idx_admissions_campus         ON admissions(campus_id);
CREATE INDEX IF NOT EXISTS idx_admissions_deadline       ON admissions(application_deadline);

-- entry_tests
CREATE INDEX IF NOT EXISTS idx_entry_tests_uni           ON entry_tests(university_id);

-- fees
CREATE INDEX IF NOT EXISTS idx_fees_uni                  ON fees(university_id);
CREATE INDEX IF NOT EXISTS idx_fees_program              ON fees(program_id);
CREATE INDEX IF NOT EXISTS idx_fees_campus               ON fees(campus_id);
CREATE INDEX IF NOT EXISTS idx_fees_year                 ON fees(fee_year);

-- scholarships
CREATE INDEX IF NOT EXISTS idx_scholarships_uni          ON scholarships(university_id);
CREATE INDEX IF NOT EXISTS idx_scholarships_type         ON scholarships(scholarship_type);

-- academic_policies
CREATE INDEX IF NOT EXISTS idx_policies_uni              ON academic_policies(university_id);
CREATE INDEX IF NOT EXISTS idx_policies_category         ON academic_policies(policy_category);

-- faculty_academics
CREATE INDEX IF NOT EXISTS idx_faculty_acad_uni          ON faculty_academics(university_id);

-- student_life
CREATE INDEX IF NOT EXISTS idx_student_life_uni          ON student_life(university_id);

-- hostels
CREATE INDEX IF NOT EXISTS idx_hostels_uni               ON hostels(university_id);
CREATE INDEX IF NOT EXISTS idx_hostels_campus            ON hostels(campus_id);

-- transport
CREATE INDEX IF NOT EXISTS idx_transport_uni             ON transport(university_id);
CREATE INDEX IF NOT EXISTS idx_transport_campus          ON transport(campus_id);

-- placements
CREATE INDEX IF NOT EXISTS idx_placements_uni            ON placements(university_id);

-- career_paths
CREATE INDEX IF NOT EXISTS idx_career_paths_uni          ON career_paths(university_id);
CREATE INDEX IF NOT EXISTS idx_career_paths_program      ON career_paths(program_id);

-- rankings
CREATE INDEX IF NOT EXISTS idx_rankings_uni              ON rankings(university_id);
CREATE INDEX IF NOT EXISTS idx_rankings_year             ON rankings(ranking_year);
CREATE INDEX IF NOT EXISTS idx_rankings_category         ON rankings(ranking_category);

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_uni               ON reviews(university_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating            ON reviews(rating_overall);

-- faqs
CREATE INDEX IF NOT EXISTS idx_faqs_uni                  ON faqs(university_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category             ON faqs(category);

-- important_links
CREATE INDEX IF NOT EXISTS idx_links_uni                 ON important_links(university_id);

-- data_collection_checklist
CREATE INDEX IF NOT EXISTS idx_checklist_uni             ON data_collection_checklist(university_id);
CREATE INDEX IF NOT EXISTS idx_checklist_collected       ON data_collection_checklist(is_collected);

-- scraping_targets
CREATE INDEX IF NOT EXISTS idx_scraping_uni              ON scraping_targets(university_id);
CREATE INDEX IF NOT EXISTS idx_scraping_priority         ON scraping_targets(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_status           ON scraping_targets(scrape_status);

-- =============================================================================
-- END OF schema_v2.sql
-- =============================================================================
