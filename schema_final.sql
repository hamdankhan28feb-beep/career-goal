-- =============================================================================
-- schema_final.sql
-- PostgreSQL 15+
-- Fresh-install schema for Career Goals
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_updated_at_trigger(target_table REGCLASS)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'DROP TRIGGER IF EXISTS set_updated_at ON %s;
     CREATE TRIGGER set_updated_at
     BEFORE UPDATE ON %s
     FOR EACH ROW
     EXECUTE FUNCTION set_updated_at();',
    target_table,
    target_table
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- Authentication and authorization
-- -----------------------------------------------------------------------------

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),
  name            TEXT,
  city            TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_not_blank CHECK (length(trim(email::TEXT)) > 3),
  CONSTRAINT users_password_hash_not_blank CHECK (length(password_hash) > 20)
);

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,
  user_agent      TEXT,
  revoked_at      TIMESTAMPTZ,

  CONSTRAINT sessions_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_valid ON sessions(expires_at) WHERE revoked_at IS NULL;

-- -----------------------------------------------------------------------------
-- Universities
-- -----------------------------------------------------------------------------

CREATE TABLE universities (
  university_id       BIGSERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  short_name          TEXT,
  slug                TEXT NOT NULL UNIQUE,
  logo_url            TEXT,
  official_website    TEXT,
  admissions_portal   TEXT,
  phone               TEXT,
  email               CITEXT,
  address             TEXT,
  city                TEXT,
  province            TEXT,
  country             TEXT NOT NULL DEFAULT 'Pakistan',
  postal_code         TEXT,
  latitude            NUMERIC(9,6),
  longitude           NUMERIC(9,6),
  year_established    INTEGER,
  charter_authority   TEXT,
  hec_status          TEXT,
  university_type     TEXT CHECK (
    university_type IN (
      'Public',
      'Private',
      'Semi-Government',
      'Federal',
      'Provincial'
    )
  ),
  social_media        JSONB NOT NULL DEFAULT '{}'::JSONB,
  virtual_tour_url    TEXT,
  source_note         TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT universities_name_not_blank CHECK (length(trim(name)) > 1),
  CONSTRAINT universities_slug_format CHECK (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT universities_year_established_valid CHECK (
    year_established IS NULL OR year_established BETWEEN 1000 AND 2100
  ),
  CONSTRAINT universities_latitude_valid CHECK (
    latitude IS NULL OR latitude BETWEEN -90 AND 90
  ),
  CONSTRAINT universities_longitude_valid CHECK (
    longitude IS NULL OR longitude BETWEEN -180 AND 180
  )
);

CREATE INDEX idx_universities_active_name
  ON universities(name)
  WHERE is_active = TRUE;

CREATE INDEX idx_universities_city
  ON universities(city);

CREATE INDEX idx_universities_type
  ON universities(university_type);

CREATE INDEX idx_universities_name_trgm
  ON universities USING GIN(name gin_trgm_ops);

CREATE INDEX idx_universities_slug_trgm
  ON universities USING GIN(slug gin_trgm_ops);

-- One current summary/profile row per university.
CREATE TABLE university_overview (
  overview_id         BIGSERIAL PRIMARY KEY,
  university_id       BIGINT NOT NULL UNIQUE
                      REFERENCES universities(university_id) ON DELETE CASCADE,
  history             TEXT,
  mission             TEXT,
  vision              TEXT,
  reputation          TEXT,
  national_ranking    TEXT,
  major_strengths     TEXT[] NOT NULL DEFAULT '{}',
  notable_alumni      TEXT[] NOT NULL DEFAULT '{}',
  key_achievements    TEXT[] NOT NULL DEFAULT '{}',
  source_urls         JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campuses (
  campus_id           BIGSERIAL PRIMARY KEY,
  university_id       BIGINT NOT NULL
                      REFERENCES universities(university_id) ON DELETE CASCADE,
  campus_name         TEXT NOT NULL,
  campus_type         TEXT,
  address             TEXT,
  city                TEXT,
  province            TEXT,
  latitude            NUMERIC(9,6),
  longitude           NUMERIC(9,6),
  campus_size_acres   NUMERIC(10,2),
  phone               TEXT,
  email               CITEXT,
  established_year    INTEGER,
  virtual_tour_url    TEXT,
  map_embed_url       TEXT,
  facilities          TEXT[] NOT NULL DEFAULT '{}',
  source_urls         JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT campuses_name_not_blank CHECK (length(trim(campus_name)) > 1),
  CONSTRAINT campuses_latitude_valid CHECK (
    latitude IS NULL OR latitude BETWEEN -90 AND 90
  ),
  CONSTRAINT campuses_longitude_valid CHECK (
    longitude IS NULL OR longitude BETWEEN -180 AND 180
  )
);

CREATE UNIQUE INDEX uq_campuses_university_name
  ON campuses(university_id, lower(campus_name));

CREATE INDEX idx_campuses_university_id ON campuses(university_id);

CREATE TABLE accreditations (
  accreditation_id    BIGSERIAL PRIMARY KEY,
  university_id       BIGINT NOT NULL
                      REFERENCES universities(university_id) ON DELETE CASCADE,
  body_name           TEXT NOT NULL,
  accreditation_type  TEXT,
  scope               TEXT,
  valid_until         DATE,
  certificate_url     TEXT,
  source_urls         JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT accreditations_body_name_not_blank CHECK (length(trim(body_name)) > 1)
);

CREATE INDEX idx_accreditations_university_id ON accreditations(university_id);

CREATE TABLE departments (
  department_id       BIGSERIAL PRIMARY KEY,
  university_id       BIGINT NOT NULL
                      REFERENCES universities(university_id) ON DELETE CASCADE,
  campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
  department_name     TEXT NOT NULL,
  faculty_name        TEXT,
  chairperson         TEXT,
  established_year    INTEGER,
  department_website  TEXT,
  source_urls         JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT departments_name_not_blank CHECK (length(trim(department_name)) > 1)
);

CREATE UNIQUE INDEX uq_departments_university_name
  ON departments(university_id, lower(department_name));

CREATE INDEX idx_departments_university_id ON departments(university_id);
CREATE INDEX idx_departments_campus_id ON departments(campus_id);

CREATE TABLE programs (
  program_id              BIGSERIAL PRIMARY KEY,
  university_id           BIGINT NOT NULL
                          REFERENCES universities(university_id) ON DELETE CASCADE,
  campus_id               BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
  department_id           BIGINT REFERENCES departments(department_id) ON DELETE SET NULL,
  program_name            TEXT NOT NULL,
  degree_type             TEXT,
  duration_years          NUMERIC(3,1),
  duration_semesters      INTEGER,
  credit_hours            INTEGER,
  delivery_mode           TEXT NOT NULL DEFAULT 'On-Campus',
  language                TEXT NOT NULL DEFAULT 'English',
  approx_merit_requirement TEXT,
  eligibility_criteria    TEXT,
  open_merit_seats        INTEGER,
  self_finance_seats      INTEGER,
  total_seats             INTEGER,
  accrediting_body        TEXT,
  program_status          TEXT NOT NULL DEFAULT 'Active',
  source_urls             JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT programs_name_not_blank CHECK (length(trim(program_name)) > 1),
  CONSTRAINT programs_duration_valid CHECK (
    duration_years IS NULL OR duration_years > 0
  ),
  CONSTRAINT programs_seats_valid CHECK (
    (open_merit_seats IS NULL OR open_merit_seats >= 0)
    AND (self_finance_seats IS NULL OR self_finance_seats >= 0)
    AND (total_seats IS NULL OR total_seats >= 0)
  )
);

CREATE INDEX idx_programs_university_id ON programs(university_id);
CREATE INDEX idx_programs_department_id ON programs(department_id);
CREATE INDEX idx_programs_degree_type ON programs(degree_type);
CREATE INDEX idx_programs_active ON programs(university_id) WHERE is_active = TRUE;
CREATE INDEX idx_programs_name_trgm ON programs USING GIN(program_name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- One-to-one university detail tables
-- -----------------------------------------------------------------------------

CREATE TABLE admissions (
  admission_id              BIGSERIAL PRIMARY KEY,
  university_id             BIGINT NOT NULL UNIQUE
                            REFERENCES universities(university_id) ON DELETE CASCADE,
  admission_cycle           TEXT,
  admission_months          TEXT,
  application_start         DATE,
  application_deadline      DATE,
  result_date               DATE,
  eligibility_criteria      TEXT,
  required_documents        TEXT[] NOT NULL DEFAULT '{}',
  admission_process         TEXT,
  merit_calculation_method  TEXT,
  interview_requirement     TEXT,
  entry_test_required       BOOLEAN NOT NULL DEFAULT FALSE,
  application_fee_pkr       NUMERIC(12,2),
  online_application_url    TEXT,
  source_urls               JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT admissions_fee_valid CHECK (
    application_fee_pkr IS NULL OR application_fee_pkr >= 0
  ),
  CONSTRAINT admissions_dates_valid CHECK (
    application_deadline IS NULL
    OR application_start IS NULL
    OR application_deadline >= application_start
  )
);

CREATE TABLE entry_tests (
  entry_test_id         BIGSERIAL PRIMARY KEY,
  university_id         BIGINT NOT NULL
                       REFERENCES universities(university_id) ON DELETE CASCADE,
  test_name             TEXT NOT NULL,
  test_type             TEXT,
  test_mode             TEXT,
  subjects_included     TEXT[] NOT NULL DEFAULT '{}',
  marks_distribution    JSONB NOT NULL DEFAULT '{}'::JSONB,
  total_marks           INTEGER,
  passing_criteria      TEXT,
  passing_marks         INTEGER,
  test_duration_min     INTEGER,
  test_fee_pkr          NUMERIC(12,2),
  test_website_url      TEXT,
  registration_deadline DATE,
  sample_pattern        TEXT,
  preparation_tips      TEXT,
  source_urls           JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT entry_tests_name_not_blank CHECK (length(trim(test_name)) > 1),
  CONSTRAINT entry_tests_numeric_valid CHECK (
    (total_marks IS NULL OR total_marks > 0)
    AND (passing_marks IS NULL OR passing_marks >= 0)
    AND (test_duration_min IS NULL OR test_duration_min > 0)
    AND (test_fee_pkr IS NULL OR test_fee_pkr >= 0)
  )
);

CREATE INDEX idx_entry_tests_university_id ON entry_tests(university_id);

CREATE TABLE fees (
  fee_id                      BIGSERIAL PRIMARY KEY,
  university_id               BIGINT NOT NULL UNIQUE
                              REFERENCES universities(university_id) ON DELETE CASCADE,
  fee_year                    INTEGER,
  fee_currency                CHAR(3) NOT NULL DEFAULT 'PKR',
  admission_fee               NUMERIC(14,2),
  semester_fee                NUMERIC(14,2),
  credit_hour_fee             NUMERIC(14,2),
  lab_fee                     NUMERIC(14,2),
  exam_fee                    NUMERIC(14,2),
  hostel_fee_monthly          NUMERIC(14,2),
  transport_fee_monthly       NUMERIC(14,2),
  security_deposit            NUMERIC(14,2),
  alumni_fee                  NUMERIC(14,2),
  approx_total_degree_cost    NUMERIC(16,2),
  fee_notes                   TEXT,
  source_urls                 JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fees_year_valid CHECK (
    fee_year IS NULL OR fee_year BETWEEN 2000 AND 2200
  ),
  CONSTRAINT fees_amounts_non_negative CHECK (
    COALESCE(admission_fee, 0) >= 0
    AND COALESCE(semester_fee, 0) >= 0
    AND COALESCE(credit_hour_fee, 0) >= 0
    AND COALESCE(lab_fee, 0) >= 0
    AND COALESCE(exam_fee, 0) >= 0
    AND COALESCE(hostel_fee_monthly, 0) >= 0
    AND COALESCE(transport_fee_monthly, 0) >= 0
    AND COALESCE(security_deposit, 0) >= 0
    AND COALESCE(alumni_fee, 0) >= 0
    AND COALESCE(approx_total_degree_cost, 0) >= 0
  )
);

CREATE TABLE scholarships (
  scholarship_id          BIGSERIAL PRIMARY KEY,
  university_id           BIGINT NOT NULL
                          REFERENCES universities(university_id) ON DELETE CASCADE,
  scholarship_name        TEXT NOT NULL,
  scholarship_type        TEXT,
  eligibility             TEXT,
  coverage_percentage     NUMERIC(5,2),
  coverage_type           TEXT,
  annual_value_pkr        NUMERIC(14,2),
  renewable               BOOLEAN NOT NULL DEFAULT FALSE,
  renewable_conditions    TEXT,
  seats_available         INTEGER,
  application_deadline    DATE,
  external_body           TEXT,
  application_url         TEXT,
  source_urls             JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT scholarships_name_not_blank CHECK (length(trim(scholarship_name)) > 1),
  CONSTRAINT scholarships_coverage_valid CHECK (
    coverage_percentage IS NULL OR coverage_percentage BETWEEN 0 AND 100
  ),
  CONSTRAINT scholarships_values_valid CHECK (
    (annual_value_pkr IS NULL OR annual_value_pkr >= 0)
    AND (seats_available IS NULL OR seats_available >= 0)
  )
);

CREATE INDEX idx_scholarships_university_id ON scholarships(university_id);
CREATE INDEX idx_scholarships_type ON scholarships(scholarship_type);

CREATE TABLE academic_policies (
  policy_id               BIGSERIAL PRIMARY KEY,
  university_id           BIGINT NOT NULL
                          REFERENCES universities(university_id) ON DELETE CASCADE,
  policy_category         TEXT NOT NULL,
  policy_name             TEXT NOT NULL,
  policy_value            TEXT,
  min_cgpa                NUMERIC(3,2),
  min_attendance_pct      NUMERIC(5,2),
  probation_cgpa          NUMERIC(3,2),
  max_repeat_attempts     INTEGER,
  graduation_min_cgpa     NUMERIC(3,2),
  effective_date          DATE,
  document_url            TEXT,
  source_urls             JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT academic_policies_name_not_blank CHECK (length(trim(policy_name)) > 1),
  CONSTRAINT academic_policies_cgpa_valid CHECK (
    (min_cgpa IS NULL OR min_cgpa BETWEEN 0 AND 4)
    AND (probation_cgpa IS NULL OR probation_cgpa BETWEEN 0 AND 4)
    AND (graduation_min_cgpa IS NULL OR graduation_min_cgpa BETWEEN 0 AND 4)
  ),
  CONSTRAINT academic_policies_attendance_valid CHECK (
    min_attendance_pct IS NULL OR min_attendance_pct BETWEEN 0 AND 100
  )
);

CREATE INDEX idx_academic_policies_university_id
  ON academic_policies(university_id);

CREATE TABLE faculty_academics (
  faculty_acad_id          BIGSERIAL PRIMARY KEY,
  university_id            BIGINT NOT NULL UNIQUE
                           REFERENCES universities(university_id) ON DELETE CASCADE,
  total_faculty_count      INTEGER,
  phd_faculty_count        INTEGER,
  student_faculty_ratio    NUMERIC(8,2),
  faculty_quality          TEXT,
  qualification_levels     TEXT,
  research_culture         TEXT,
  publications_count       INTEGER,
  research_grants          TEXT,
  notable_faculty          JSONB NOT NULL DEFAULT '[]'::JSONB,
  lab_facilities           TEXT,
  industry_exposure        TEXT,
  internship_support       TEXT,
  fyp_culture              TEXT,
  source_urls              JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT faculty_academics_counts_valid CHECK (
    (total_faculty_count IS NULL OR total_faculty_count >= 0)
    AND (phd_faculty_count IS NULL OR phd_faculty_count >= 0)
    AND (
      total_faculty_count IS NULL
      OR phd_faculty_count IS NULL
      OR phd_faculty_count <= total_faculty_count
    )
  )
);

CREATE TABLE student_life (
  student_life_id          BIGSERIAL PRIMARY KEY,
  university_id            BIGINT NOT NULL UNIQUE
                           REFERENCES universities(university_id) ON DELETE CASCADE,
  clubs_and_societies      TEXT[] NOT NULL DEFAULT '{}',
  sports_facilities        TEXT[] NOT NULL DEFAULT '{}',
  events_and_festivals     TEXT[] NOT NULL DEFAULT '{}',
  student_support_services TEXT[] NOT NULL DEFAULT '{}',
  campus_culture           TEXT,
  source_urls              JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campus_facilities (
  facility_id              BIGSERIAL PRIMARY KEY,
  university_id            BIGINT NOT NULL
                           REFERENCES universities(university_id) ON DELETE CASCADE,
  campus_id                BIGINT REFERENCES campuses(campus_id) ON DELETE CASCADE,
  facility_category        TEXT NOT NULL,
  facility_name            TEXT NOT NULL,
  description              TEXT,
  capacity                 INTEGER,
  operating_hours          TEXT,
  is_available             BOOLEAN NOT NULL DEFAULT TRUE,
  notes                    TEXT,
  source_urls              JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT campus_facilities_name_not_blank CHECK (length(trim(facility_name)) > 1),
  CONSTRAINT campus_facilities_capacity_valid CHECK (
    capacity IS NULL OR capacity >= 0
  )
);

CREATE INDEX idx_campus_facilities_university_id
  ON campus_facilities(university_id);

CREATE INDEX idx_campus_facilities_campus_id
  ON campus_facilities(campus_id);

CREATE TABLE hostels (
  hostel_id                BIGSERIAL PRIMARY KEY,
  university_id            BIGINT NOT NULL UNIQUE
                           REFERENCES universities(university_id) ON DELETE CASCADE,
  availability             TEXT,
  male_hostel_available    BOOLEAN,
  female_hostel_available  BOOLEAN,
  room_types               TEXT[] NOT NULL DEFAULT '{}',
  monthly_fee_pkr          NUMERIC(14,2),
  mess_available           BOOLEAN,
  hostel_rules             TEXT,
  source_urls              JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT hostels_monthly_fee_valid CHECK (
    monthly_fee_pkr IS NULL OR monthly_fee_pkr >= 0
  )
);

CREATE TABLE transport (
  transport_id             BIGSERIAL PRIMARY KEY,
  university_id            BIGINT NOT NULL UNIQUE
                           REFERENCES universities(university_id) ON DELETE CASCADE,
  service_available        BOOLEAN NOT NULL DEFAULT FALSE,
  routes                   TEXT[] NOT NULL DEFAULT '{}',
  monthly_fee_pkr          NUMERIC(14,2),
  pick_drop_areas          TEXT[] NOT NULL DEFAULT '{}',
  schedule_note            TEXT,
  source_urls              JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transport_monthly_fee_valid CHECK (
    monthly_fee_pkr IS NULL OR monthly_fee_pkr >= 0
  )
);

CREATE TABLE placements (
  placement_id              BIGSERIAL PRIMARY KEY,
  university_id             BIGINT NOT NULL UNIQUE
                            REFERENCES universities(university_id) ON DELETE CASCADE,
  placement_office_url      TEXT,
  placement_rate_pct        NUMERIC(5,2),
  avg_starting_salary_pkr   NUMERIC(14,2),
  industry_partnerships     TEXT[] NOT NULL DEFAULT '{}',
  alumni_count              INTEGER,
  linkedin_alumni_url       TEXT,
  top_recruiters            TEXT[] NOT NULL DEFAULT '{}',
  placement_notes           TEXT,
  source_urls               JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT placements_rate_valid CHECK (
    placement_rate_pct IS NULL OR placement_rate_pct BETWEEN 0 AND 100
  ),
  CONSTRAINT placements_values_valid CHECK (
    (avg_starting_salary_pkr IS NULL OR avg_starting_salary_pkr >= 0)
    AND (alumni_count IS NULL OR alumni_count >= 0)
  )
);

CREATE TABLE career_paths (
  career_path_id              BIGSERIAL PRIMARY KEY,
  university_id               BIGINT NOT NULL UNIQUE
                              REFERENCES universities(university_id) ON DELETE CASCADE,
  career_paths                TEXT[] NOT NULL DEFAULT '{}',
  industries                  TEXT[] NOT NULL DEFAULT '{}',
  government_opportunities    TEXT[] NOT NULL DEFAULT '{}',
  private_opportunities       TEXT[] NOT NULL DEFAULT '{}',
  higher_education_paths      TEXT[] NOT NULL DEFAULT '{}',
  certifications              TEXT[] NOT NULL DEFAULT '{}',
  international_opportunities TEXT,
  source_urls                 JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rankings (
  ranking_id             BIGSERIAL PRIMARY KEY,
  university_id          BIGINT NOT NULL
                         REFERENCES universities(university_id) ON DELETE CASCADE,
  ranking_category       TEXT NOT NULL,
  ranking_organization   TEXT NOT NULL,
  ranking_value          TEXT NOT NULL,
  ranking_year           INTEGER NOT NULL,
  ranking_url            TEXT,
  source_urls            JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rankings_year_valid CHECK (ranking_year BETWEEN 1900 AND 2200)
);

CREATE INDEX idx_rankings_university_id ON rankings(university_id);
CREATE INDEX idx_rankings_year_category ON rankings(ranking_year, ranking_category);

-- -----------------------------------------------------------------------------
-- Community content
-- -----------------------------------------------------------------------------

CREATE TABLE reviews (
  review_id                BIGSERIAL PRIMARY KEY,
  university_id            BIGINT NOT NULL
                           REFERENCES universities(university_id) ON DELETE CASCADE,
  user_id                  UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name            TEXT,
  reviewer_type            TEXT,
  graduation_year          INTEGER,
  title                    TEXT NOT NULL,
  body                     TEXT NOT NULL,
  rating_overall           NUMERIC(2,1) NOT NULL,
  rating_faculty           NUMERIC(2,1),
  rating_facilities        NUMERIC(2,1),
  rating_value_for_money   NUMERIC(2,1),
  pros                     TEXT[] NOT NULL DEFAULT '{}',
  cons                     TEXT[] NOT NULL DEFAULT '{}',
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
  verified                 BOOLEAN NOT NULL DEFAULT FALSE,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  review_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_title_not_blank CHECK (length(trim(title)) > 1),
  CONSTRAINT reviews_body_not_blank CHECK (length(trim(body)) > 5),
  CONSTRAINT reviews_rating_overall_valid CHECK (rating_overall BETWEEN 1 AND 5),
  CONSTRAINT reviews_rating_faculty_valid CHECK (
    rating_faculty IS NULL OR rating_faculty BETWEEN 1 AND 5
  ),
  CONSTRAINT reviews_rating_facilities_valid CHECK (
    rating_facilities IS NULL OR rating_facilities BETWEEN 1 AND 5
  ),
  CONSTRAINT reviews_rating_value_valid CHECK (
    rating_value_for_money IS NULL OR rating_value_for_money BETWEEN 1 AND 5
  )
);

CREATE INDEX idx_reviews_public
  ON reviews(university_id, created_at DESC)
  WHERE status = 'approved' AND is_active = TRUE;

CREATE INDEX idx_reviews_moderation
  ON reviews(status, created_at ASC)
  WHERE is_active = TRUE;

CREATE INDEX idx_reviews_user_id ON reviews(user_id);

CREATE TABLE faqs (
  faq_id                  BIGSERIAL PRIMARY KEY,
  university_id           BIGINT NOT NULL
                          REFERENCES universities(university_id) ON DELETE CASCADE,
  category                TEXT,
  question                TEXT NOT NULL,
  answer                  TEXT NOT NULL,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  source_urls             JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT faqs_question_not_blank CHECK (length(trim(question)) > 1),
  CONSTRAINT faqs_answer_not_blank CHECK (length(trim(answer)) > 1)
);

CREATE INDEX idx_faqs_university_sort
  ON faqs(university_id, sort_order);

CREATE TABLE important_links (
  link_id                 BIGSERIAL PRIMARY KEY,
  university_id           BIGINT NOT NULL
                          REFERENCES universities(university_id) ON DELETE CASCADE,
  link_category           TEXT,
  label                   TEXT NOT NULL,
  url                     TEXT NOT NULL,
  description             TEXT,
  is_unofficial           BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  source_urls             JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT important_links_label_not_blank CHECK (length(trim(label)) > 1),
  CONSTRAINT important_links_url_not_blank CHECK (length(trim(url)) > 5)
);

CREATE INDEX idx_important_links_university_sort
  ON important_links(university_id, sort_order);

-- -----------------------------------------------------------------------------
-- Attach automatic timestamps to every mutable table.
-- -----------------------------------------------------------------------------

SELECT create_updated_at_trigger('users');
SELECT create_updated_at_trigger('universities');
SELECT create_updated_at_trigger('university_overview');
SELECT create_updated_at_trigger('campuses');
SELECT create_updated_at_trigger('accreditations');
SELECT create_updated_at_trigger('departments');
SELECT create_updated_at_trigger('programs');
SELECT create_updated_at_trigger('admissions');
SELECT create_updated_at_trigger('entry_tests');
SELECT create_updated_at_trigger('fees');
SELECT create_updated_at_trigger('scholarships');
SELECT create_updated_at_trigger('academic_policies');
SELECT create_updated_at_trigger('faculty_academics');
SELECT create_updated_at_trigger('student_life');
SELECT create_updated_at_trigger('campus_facilities');
SELECT create_updated_at_trigger('hostels');
SELECT create_updated_at_trigger('transport');
SELECT create_updated_at_trigger('placements');
SELECT create_updated_at_trigger('career_paths');
SELECT create_updated_at_trigger('rankings');
SELECT create_updated_at_trigger('reviews');
SELECT create_updated_at_trigger('faqs');
SELECT create_updated_at_trigger('important_links');

COMMIT;