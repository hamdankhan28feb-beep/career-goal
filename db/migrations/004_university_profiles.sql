-- 004_university_profiles.sql
-- Idempotent: detailed, field-level-sourced university profiles (Batch 1+).
-- profile_details holds the JSON profile (sections -> fields with value/status/source)
-- exactly as stored in data/research/university_profiles_batch1.json.
-- Does NOT touch verification_status (research-row status) or any user data.

ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS profile_details JSONB,
  ADD COLUMN IF NOT EXISTS profile_status TEXT,
  ADD COLUMN IF NOT EXISTS profile_checked_at DATE;

DO $chk$ BEGIN
  ALTER TABLE universities
    ADD CONSTRAINT universities_profile_status_check
    CHECK (profile_status IS NULL OR profile_status IN ('complete', 'partial'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $chk$;
