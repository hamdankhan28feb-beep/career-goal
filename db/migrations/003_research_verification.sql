-- 003_research_verification.sql
-- Idempotent research verification columns + scholarship/learning tables

BEGIN;

ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS verification_status TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at DATE,
  ADD COLUMN IF NOT EXISTS research_id TEXT,
  ADD COLUMN IF NOT EXISTS ownership_source TEXT;

DO $chk$ BEGIN
  ALTER TABLE universities
    ADD CONSTRAINT universities_verification_status_check
    CHECK (verification_status IS NULL OR verification_status IN ('verified', 'partial', 'unverified'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $chk$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_research_id
  ON universities (research_id) WHERE research_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS research_scholarships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT,
  provider_type TEXT,
  status TEXT NOT NULL DEFAULT 'unknown',
  academic_eligibility TEXT,
  financial_eligibility TEXT,
  award_coverage TEXT,
  deadline TEXT,
  application_url TEXT,
  source_url TEXT,
  eligible_levels TEXT,
  eligible_locations TEXT,
  eligible_universities TEXT,
  renewal_notes TEXT,
  documents_required TEXT,
  notes TEXT,
  missing_fields TEXT,
  last_verified_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT research_scholarships_status_check
    CHECK (status IN ('active', 'closed', 'unknown', 'upcoming'))
);

CREATE INDEX IF NOT EXISTS idx_research_scholarships_status ON research_scholarships(status);
CREATE INDEX IF NOT EXISTS idx_research_scholarships_provider ON research_scholarships(provider);

CREATE TABLE IF NOT EXISTS research_learning_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT,
  topic TEXT,
  level TEXT,
  cost TEXT,
  language TEXT,
  notes TEXT,
  last_verified_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_learning_resources_url
  ON research_learning_resources (url);

COMMIT;
