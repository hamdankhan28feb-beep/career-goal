-- =============================================================================
-- migration_to_final.sql
-- Upgrade a database created with schema.sql / schema_v2.sql.
--
-- IMPORTANT:
-- 1. Back up the database before running this script.
-- 2. Run this script once.
-- 3. It preserves the newest record for each one-to-one university table.
-- 4. It deliberately removes all old *_new, *_int, and *_arr staging columns.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
     FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
    target_table,
    target_table
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- Users: convert the insecure legacy users table to the final shape.
-- Old plaintext passwords must be replaced by a secure reset flow.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '__RESET_REQUIRED__',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  name TEXT,
  city TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Never transfer plaintext `password` values into `password_hash`.
-- Existing accounts must use password-reset after deployment.
UPDATE users
SET password_hash = '__RESET_REQUIRED__'
WHERE password_hash IS NULL OR password_hash = '';

ALTER TABLE users
  ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'password'
  ) THEN
    ALTER TABLE users DROP COLUMN password;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
  ON users (lower(email::TEXT));

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT sessions_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_valid
  ON sessions(expires_at) WHERE revoked_at IS NULL;

-- -----------------------------------------------------------------------------
-- Universities: typed numeric and coordinate values.
-- -----------------------------------------------------------------------------

ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Extract "latitude,longitude" legacy coordinate strings safely.
UPDATE universities
SET
  latitude = NULLIF(trim(split_part(coordinates, ',', 1)), '')::NUMERIC(9,6),
  longitude = NULLIF(trim(split_part(coordinates, ',', 2)), '')::NUMERIC(9,6)
WHERE coordinates IS NOT NULL
  AND coordinates ~ '^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$'
  AND latitude IS NULL
  AND longitude IS NULL;

DO $$
DECLARE
  existing_type TEXT;
BEGIN
  SELECT data_type
  INTO existing_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'universities'
    AND column_name = 'year_established';

  IF existing_type IN ('text', 'character varying') THEN
    ALTER TABLE universities
      ALTER COLUMN year_established TYPE INTEGER
      USING CASE
        WHEN trim(year_established) ~ '^\d{4}$'
        THEN trim(year_established)::INTEGER
        ELSE NULL
      END;
  END IF;
END;
$$;

ALTER TABLE universities DROP COLUMN IF EXISTS coordinates;

ALTER TABLE universities
  DROP CONSTRAINT IF EXISTS universities_year_established_valid,
  ADD CONSTRAINT universities_year_established_valid
    CHECK (year_established IS NULL OR year_established BETWEEN 1000 AND 2100),
  DROP CONSTRAINT IF EXISTS universities_latitude_valid,
  ADD CONSTRAINT universities_latitude_valid
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  DROP CONSTRAINT IF EXISTS universities_longitude_valid,
  ADD CONSTRAINT universities_longitude_valid
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

CREATE INDEX IF NOT EXISTS idx_universities_active_name
  ON universities(name) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(university_type);
CREATE INDEX IF NOT EXISTS idx_universities_name_trgm
  ON universities USING GIN(name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Campuses and programs: remove text-number remnants and legacy coordinates.
-- -----------------------------------------------------------------------------

ALTER TABLE campuses
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

UPDATE campuses
SET
  latitude = NULLIF(trim(split_part(coordinates, ',', 1)), '')::NUMERIC(9,6),
  longitude = NULLIF(trim(split_part(coordinates, ',', 2)), '')::NUMERIC(9,6)
WHERE coordinates IS NOT NULL
  AND coordinates ~ '^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$'
  AND latitude IS NULL
  AND longitude IS NULL;

ALTER TABLE campuses DROP COLUMN IF EXISTS coordinates;

DO $$
DECLARE
  existing_type TEXT;
BEGIN
  SELECT data_type
  INTO existing_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'programs'
    AND column_name = 'total_seats';

  IF existing_type IN ('text', 'character varying') THEN
    ALTER TABLE programs
      ALTER COLUMN total_seats TYPE INTEGER
      USING CASE
        WHEN trim(total_seats) ~ '^\d+$'
        THEN trim(total_seats)::INTEGER
        ELSE NULL
      END;
  END IF;
END;
$$;

ALTER TABLE programs DROP COLUMN IF EXISTS total_seats_int;
ALTER TABLE programs
  DROP CONSTRAINT IF EXISTS programs_total_seats_valid,
  ADD CONSTRAINT programs_total_seats_valid
    CHECK (total_seats IS NULL OR total_seats >= 0);

CREATE INDEX IF NOT EXISTS idx_programs_university_id ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_degree_type ON programs(degree_type);
CREATE INDEX IF NOT EXISTS idx_programs_name_trgm
  ON programs USING GIN(program_name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Remove obsolete migration staging columns.
-- -----------------------------------------------------------------------------

ALTER TABLE universities DROP COLUMN IF EXISTS university_type_new;
ALTER TABLE campuses DROP COLUMN IF EXISTS campus_type_new;
ALTER TABLE programs DROP COLUMN IF EXISTS degree_type_new;
ALTER TABLE admissions DROP COLUMN IF EXISTS required_documents_arr;
ALTER TABLE entry_tests DROP COLUMN IF EXISTS subjects_arr;
ALTER TABLE entry_tests DROP COLUMN IF EXISTS marks_distribution_json;
ALTER TABLE scholarships DROP COLUMN IF EXISTS scholarship_type_new;
ALTER TABLE placements DROP COLUMN IF EXISTS industry_partnerships_arr;
ALTER TABLE placements DROP COLUMN IF EXISTS top_recruiters_arr;
ALTER TABLE career_paths DROP COLUMN IF EXISTS career_paths_arr;
ALTER TABLE career_paths DROP COLUMN IF EXISTS industries_arr;
ALTER TABLE career_paths DROP COLUMN IF EXISTS government_arr;
ALTER TABLE career_paths DROP COLUMN IF EXISTS private_arr;
ALTER TABLE career_paths DROP COLUMN IF EXISTS higher_edu_arr;
ALTER TABLE career_paths DROP COLUMN IF EXISTS certifications_arr;

-- -----------------------------------------------------------------------------
-- Convert legacy comma-separated fields to arrays where the original data allows.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  existing_type TEXT;
BEGIN
  SELECT data_type
  INTO existing_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'admissions'
    AND column_name = 'required_documents';

  IF existing_type IN ('text', 'character varying') THEN
    ALTER TABLE admissions
      ALTER COLUMN required_documents TYPE TEXT[]
      USING CASE
        WHEN required_documents IS NULL OR trim(required_documents) = ''
        THEN ARRAY[]::TEXT[]
        ELSE regexp_split_to_array(required_documents, '\s*,\s*')
      END;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Deduplicate one-to-one tables before adding UNIQUE(university_id).
-- Keeps the newest row by updated_at, then primary key.
-- -----------------------------------------------------------------------------

DELETE FROM university_overview older
USING university_overview newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.overview_id < newer.overview_id)
  );

DELETE FROM admissions older
USING admissions newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.admission_id < newer.admission_id)
  );

DELETE FROM fees older
USING fees newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.fee_id < newer.fee_id)
  );

DELETE FROM faculty_academics older
USING faculty_academics newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.faculty_acad_id < newer.faculty_acad_id)
  );

DELETE FROM student_life older
USING student_life newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.student_life_id < newer.student_life_id)
  );

DELETE FROM hostels older
USING hostels newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.hostel_id < newer.hostel_id)
  );

DELETE FROM transport older
USING transport newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.transport_id < newer.transport_id)
  );

DELETE FROM placements older
USING placements newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.placement_id < newer.placement_id)
  );

DELETE FROM career_paths older
USING career_paths newer
WHERE older.university_id = newer.university_id
  AND (
    older.updated_at < newer.updated_at
    OR (older.updated_at = newer.updated_at AND older.career_path_id < newer.career_path_id)
  );

ALTER TABLE university_overview
  DROP CONSTRAINT IF EXISTS university_overview_university_id_key,
  ADD CONSTRAINT university_overview_university_id_key UNIQUE (university_id);

ALTER TABLE admissions
  DROP CONSTRAINT IF EXISTS admissions_university_id_key,
  ADD CONSTRAINT admissions_university_id_key UNIQUE (university_id);

ALTER TABLE fees
  DROP CONSTRAINT IF EXISTS fees_university_id_key,
  ADD CONSTRAINT fees_university_id_key UNIQUE (university_id);

ALTER TABLE faculty_academics
  DROP CONSTRAINT IF EXISTS faculty_academics_university_id_key,
  ADD CONSTRAINT faculty_academics_university_id_key UNIQUE (university_id);

ALTER TABLE student_life
  DROP CONSTRAINT IF EXISTS student_life_university_id_key,
  ADD CONSTRAINT student_life_university_id_key UNIQUE (university_id);

ALTER TABLE hostels
  DROP CONSTRAINT IF EXISTS hostels_university_id_key,
  ADD CONSTRAINT hostels_university_id_key UNIQUE (university_id);

ALTER TABLE transport
  DROP CONSTRAINT IF EXISTS transport_university_id_key,
  ADD CONSTRAINT transport_university_id_key UNIQUE (university_id);

ALTER TABLE placements
  DROP CONSTRAINT IF EXISTS placements_university_id_key,
  ADD CONSTRAINT placements_university_id_key UNIQUE (university_id);

ALTER TABLE career_paths
  DROP CONSTRAINT IF EXISTS career_paths_university_id_key,
  ADD CONSTRAINT career_paths_university_id_key UNIQUE (university_id);

-- -----------------------------------------------------------------------------
-- Reviews: tie reviews to optional registered users and enforce safe values.
-- -----------------------------------------------------------------------------

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_overall_valid,
  ADD CONSTRAINT reviews_rating_overall_valid
    CHECK (rating_overall IS NULL OR rating_overall BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS idx_reviews_public
  ON reviews(university_id, created_at DESC)
  WHERE status = 'approved' AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_reviews_moderation
  ON reviews(status, created_at ASC)
  WHERE is_active = TRUE;

-- -----------------------------------------------------------------------------
-- Timestamp triggers. Tables that do not exist in a particular legacy database
-- are safely skipped.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'universities',
    'university_overview',
    'campuses',
    'accreditations',
    'departments',
    'programs',
    'admissions',
    'entry_tests',
    'fees',
    'scholarships',
    'academic_policies',
    'faculty_academics',
    'student_life',
    'campus_facilities',
    'hostels',
    'transport',
    'placements',
    'career_paths',
    'rankings',
    'reviews',
    'faqs',
    'important_links'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      PERFORM create_updated_at_trigger(('public.' || table_name)::REGCLASS);
    END IF;
  END LOOP;
END;
$$;

COMMIT;