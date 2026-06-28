-- =============================================================================
-- MIGRATION  v1 → v2  |  migration_v1_to_v2.sql
-- Run this BEFORE schema_v2.sql if you have an existing v1 database.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards).
-- Generated: 2026-06-25
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Add extension for fuzzy search
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- STEP 2: Create ENUM types (safe — wrapped in DO blocks)
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
-- STEP 3: Auto-timestamp trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- STEP 4: ALTER universities — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS slug                TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url            TEXT,
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS email               TEXT,
  ADD COLUMN IF NOT EXISTS address             TEXT,
  ADD COLUMN IF NOT EXISTS city                TEXT,
  ADD COLUMN IF NOT EXISTS province            TEXT,
  ADD COLUMN IF NOT EXISTS country             TEXT NOT NULL DEFAULT 'Pakistan',
  ADD COLUMN IF NOT EXISTS postal_code         TEXT,
  ADD COLUMN IF NOT EXISTS coordinates         TEXT,
  ADD COLUMN IF NOT EXISTS charter_authority   TEXT,
  ADD COLUMN IF NOT EXISTS hec_status          TEXT,
  ADD COLUMN IF NOT EXISTS history             TEXT,
  ADD COLUMN IF NOT EXISTS mission             TEXT,
  ADD COLUMN IF NOT EXISTS vision              TEXT,
  ADD COLUMN IF NOT EXISTS reputation_note     TEXT,
  ADD COLUMN IF NOT EXISTS major_strengths     TEXT[],
  ADD COLUMN IF NOT EXISTS social_media        JSONB,
  ADD COLUMN IF NOT EXISTS virtual_tour_url    TEXT,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE;

-- Migrate year_established: cast TEXT to INTEGER where possible
-- Safe update — only changes rows where text is a valid integer
UPDATE universities
SET year_established = year_established::INTEGER::TEXT
WHERE year_established ~ '^\d{4}$';

-- Migrate university_type text to enum (add temp column)
ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS university_type_new university_type_enum;

UPDATE universities
SET university_type_new = university_type::university_type_enum
WHERE university_type IN ('Public','Private','Semi-Government','Federal','Provincial');

-- Copy back and rename (only if migration not already done)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='universities' AND column_name='university_type'
    AND data_type='text'
  ) THEN
    ALTER TABLE universities DROP COLUMN university_type;
    ALTER TABLE universities RENAME COLUMN university_type_new TO university_type;
  END IF;
END $$;

-- Add updated_at trigger to universities
DROP TRIGGER IF EXISTS set_timestamp_universities ON universities;
CREATE TRIGGER set_timestamp_universities
  BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 5: ALTER campuses — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE campuses
  ADD COLUMN IF NOT EXISTS address             TEXT,
  ADD COLUMN IF NOT EXISTS city                TEXT,
  ADD COLUMN IF NOT EXISTS province            TEXT,
  ADD COLUMN IF NOT EXISTS coordinates         TEXT,
  ADD COLUMN IF NOT EXISTS campus_size_acres   NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS email               TEXT,
  ADD COLUMN IF NOT EXISTS established_year    INTEGER,
  ADD COLUMN IF NOT EXISTS virtual_tour_url    TEXT,
  ADD COLUMN IF NOT EXISTS map_embed_url       TEXT,
  ADD COLUMN IF NOT EXISTS facilities          TEXT[],
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE;

-- Migrate campus_type to enum
ALTER TABLE campuses
  ADD COLUMN IF NOT EXISTS campus_type_new campus_type_enum;

UPDATE campuses
SET campus_type_new = campus_type::campus_type_enum
WHERE campus_type IN ('Main','City','Satellite','Medical','Health Sciences','Research','Online','IPP','Other');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campuses' AND column_name='campus_type'
    AND data_type='text'
  ) THEN
    ALTER TABLE campuses DROP COLUMN campus_type;
    ALTER TABLE campuses RENAME COLUMN campus_type_new TO campus_type;
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_timestamp_campuses ON campuses;
CREATE TRIGGER set_timestamp_campuses
  BEFORE UPDATE ON campuses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 6: ALTER programs — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS department_id       BIGINT REFERENCES departments(department_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_years      NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS duration_semesters  INTEGER,
  ADD COLUMN IF NOT EXISTS credit_hours        INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_mode       delivery_mode_enum DEFAULT 'On-Campus',
  ADD COLUMN IF NOT EXISTS language            TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS open_merit_seats    INTEGER,
  ADD COLUMN IF NOT EXISTS self_finance_seats  INTEGER,
  ADD COLUMN IF NOT EXISTS accrediting_body    TEXT,
  ADD COLUMN IF NOT EXISTS program_status      TEXT DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE;

-- Migrate degree_type to enum
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS degree_type_new degree_type_enum;

UPDATE programs
SET degree_type_new = degree_type::degree_type_enum
WHERE degree_type IN ('Certificate','Diploma','Associate','BS','BE','MBBS','BDS','BArch','LLB','MS','MBA','MPhil','MD','PhD','PGD','Other');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='programs' AND column_name='degree_type'
    AND data_type='text'
  ) THEN
    ALTER TABLE programs DROP COLUMN degree_type;
    ALTER TABLE programs RENAME COLUMN degree_type_new TO degree_type;
  END IF;
END $$;

-- Migrate total_seats to INTEGER (was TEXT)
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS total_seats_int INTEGER;

UPDATE programs
SET total_seats_int = total_seats::INTEGER
WHERE total_seats ~ '^\d+$';

DROP TRIGGER IF EXISTS set_timestamp_programs ON programs;
CREATE TRIGGER set_timestamp_programs
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 7: ALTER admissions — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS application_start   DATE,
  ADD COLUMN IF NOT EXISTS application_deadline DATE,
  ADD COLUMN IF NOT EXISTS result_date         DATE,
  ADD COLUMN IF NOT EXISTS entry_test_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS application_fee_pkr NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS online_application_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE;

-- Migrate required_documents TEXT → TEXT[]
ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS required_documents_arr TEXT[];

DROP TRIGGER IF EXISTS set_timestamp_admissions ON admissions;
CREATE TRIGGER set_timestamp_admissions
  BEFORE UPDATE ON admissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 8: ALTER entry_tests — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE entry_tests
  ADD COLUMN IF NOT EXISTS test_mode           TEXT,
  ADD COLUMN IF NOT EXISTS subjects_arr        TEXT[],
  ADD COLUMN IF NOT EXISTS marks_distribution_json JSONB,
  ADD COLUMN IF NOT EXISTS total_marks         INTEGER,
  ADD COLUMN IF NOT EXISTS passing_marks       INTEGER,
  ADD COLUMN IF NOT EXISTS test_duration_min   INTEGER,
  ADD COLUMN IF NOT EXISTS test_fee_pkr        NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS test_website_url    TEXT,
  ADD COLUMN IF NOT EXISTS registration_deadline DATE,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_entry_tests ON entry_tests;
CREATE TRIGGER set_timestamp_entry_tests
  BEFORE UPDATE ON entry_tests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 9: ALTER fees — add new columns, add FK to programs
-- ---------------------------------------------------------------------------
ALTER TABLE fees
  ADD COLUMN IF NOT EXISTS program_id          BIGINT REFERENCES programs(program_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campus_id           BIGINT REFERENCES campuses(campus_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fee_year            INTEGER,
  ADD COLUMN IF NOT EXISTS fee_currency        TEXT NOT NULL DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS lab_fee             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS exam_fee            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS hostel_fee_monthly  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS transport_fee_monthly NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS alumni_fee          NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fee_notes           TEXT,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_fees ON fees;
CREATE TRIGGER set_timestamp_fees
  BEFORE UPDATE ON fees
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 10: ALTER scholarships — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE scholarships
  ADD COLUMN IF NOT EXISTS scholarship_type_new scholarship_type_enum,
  ADD COLUMN IF NOT EXISTS coverage_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS coverage_type       TEXT,
  ADD COLUMN IF NOT EXISTS annual_value_pkr    NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS renewable           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS renewable_conditions TEXT,
  ADD COLUMN IF NOT EXISTS seats_available     INTEGER,
  ADD COLUMN IF NOT EXISTS application_deadline DATE,
  ADD COLUMN IF NOT EXISTS external_body       TEXT,
  ADD COLUMN IF NOT EXISTS application_url     TEXT,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_scholarships ON scholarships;
CREATE TRIGGER set_timestamp_scholarships
  BEFORE UPDATE ON scholarships
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 11: Rename old tables to _legacy (preserve original data)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS policies RENAME TO policies_legacy;
ALTER TABLE IF EXISTS faculty  RENAME TO faculty_legacy;
ALTER TABLE IF EXISTS facilities RENAME TO facilities_legacy;

-- (The v2 schema creates: academic_policies, faculty_academics, campus_facilities)

-- ---------------------------------------------------------------------------
-- STEP 12: ALTER placements — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE placements
  ADD COLUMN IF NOT EXISTS placement_office_url TEXT,
  ADD COLUMN IF NOT EXISTS placement_rate_pct   NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_starting_salary_pkr NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS industry_partnerships_arr TEXT[],
  ADD COLUMN IF NOT EXISTS alumni_count         INTEGER,
  ADD COLUMN IF NOT EXISTS linkedin_alumni_url  TEXT,
  ADD COLUMN IF NOT EXISTS top_recruiters_arr   TEXT[],
  ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_placements ON placements;
CREATE TRIGGER set_timestamp_placements
  BEFORE UPDATE ON placements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 13: ALTER career_paths — add program_id FK
-- ---------------------------------------------------------------------------
ALTER TABLE career_paths
  ADD COLUMN IF NOT EXISTS program_id           BIGINT REFERENCES programs(program_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS career_paths_arr     TEXT[],
  ADD COLUMN IF NOT EXISTS industries_arr       TEXT[],
  ADD COLUMN IF NOT EXISTS government_arr       TEXT[],
  ADD COLUMN IF NOT EXISTS private_arr          TEXT[],
  ADD COLUMN IF NOT EXISTS higher_edu_arr       TEXT[],
  ADD COLUMN IF NOT EXISTS certifications_arr   TEXT[],
  ADD COLUMN IF NOT EXISTS international_opportunities TEXT,
  ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_career_paths ON career_paths;
CREATE TRIGGER set_timestamp_career_paths
  BEFORE UPDATE ON career_paths
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 14: ALTER rankings — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE rankings
  ADD COLUMN IF NOT EXISTS ranking_category     ranking_category_enum,
  ADD COLUMN IF NOT EXISTS ranking_year         INTEGER,
  ADD COLUMN IF NOT EXISTS ranking_url          TEXT,
  ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_rankings ON rankings;
CREATE TRIGGER set_timestamp_rankings
  BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 15: ALTER reviews — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS reviewer_type        reviewer_type_enum,
  ADD COLUMN IF NOT EXISTS review_date          DATE,
  ADD COLUMN IF NOT EXISTS rating_overall       NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS rating_faculty       NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS rating_facilities    NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS rating_value_for_money NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS pros                 TEXT[],
  ADD COLUMN IF NOT EXISTS cons                 TEXT[],
  ADD COLUMN IF NOT EXISTS verified             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_reviews ON reviews;
CREATE TRIGGER set_timestamp_reviews
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 16: ALTER faqs — add new columns
-- ---------------------------------------------------------------------------
ALTER TABLE faqs
  ADD COLUMN IF NOT EXISTS category             TEXT,
  ADD COLUMN IF NOT EXISTS sort_order           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_faqs ON faqs;
CREATE TRIGGER set_timestamp_faqs
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 17: Rename links → important_links, add new column
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS links RENAME TO important_links;
ALTER TABLE important_links
  ADD COLUMN IF NOT EXISTS link_category        TEXT,
  ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT TRUE;

DROP TRIGGER IF EXISTS set_timestamp_important_links ON important_links;
CREATE TRIGGER set_timestamp_important_links
  BEFORE UPDATE ON important_links
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ---------------------------------------------------------------------------
-- STEP 18: Re-create all new indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_universities_slug       ON universities(slug);
CREATE INDEX IF NOT EXISTS idx_universities_type       ON universities(university_type);
CREATE INDEX IF NOT EXISTS idx_universities_city       ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_name_trgm  ON universities USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_programs_degree_type    ON programs(degree_type);
CREATE INDEX IF NOT EXISTS idx_programs_name_trgm      ON programs USING GIN (program_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admissions_deadline     ON admissions(application_deadline);
CREATE INDEX IF NOT EXISTS idx_fees_year               ON fees(fee_year);
CREATE INDEX IF NOT EXISTS idx_scholarships_type       ON scholarships(scholarship_type_new);
CREATE INDEX IF NOT EXISTS idx_rankings_year           ON rankings(ranking_year);
CREATE INDEX IF NOT EXISTS idx_rankings_category       ON rankings(ranking_category);
CREATE INDEX IF NOT EXISTS idx_reviews_rating          ON reviews(rating_overall);
CREATE INDEX IF NOT EXISTS idx_faqs_category           ON faqs(category);

-- =============================================================================
-- END OF migration_v1_to_v2.sql
-- =============================================================================
