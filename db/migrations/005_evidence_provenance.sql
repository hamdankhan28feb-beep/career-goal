-- 005_evidence_provenance.sql
-- Additive only. Does not DROP columns or delete rows.
-- verification_status, profile_status and JSON field_counts are deprecated for display.
-- Read deriveUniversityStatus() instead. Do not drop the columns.

BEGIN;

COMMENT ON COLUMN universities.verification_status IS
  'DEPRECATED for display. Do not read this for badges. Derive status with deriveUniversityStatus from field evidence. Column retained.';

COMMENT ON COLUMN universities.profile_status IS
  'DEPRECATED for display. Do not read this for Detailed/Partial labels. Derive from field evidence. Column retained.';

COMMENT ON COLUMN universities.last_verified_at IS
  'Set only by scripts/record-verification.mjs or an admin action that inserts a verification_events row. Do not default to now() and do not copy hand-typed research dates.';

COMMENT ON COLUMN universities.profile_checked_at IS
  'DEPRECATED as a display date. A shown check date must come from verification_events.checked_at.';

CREATE TABLE IF NOT EXISTS verification_events (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT,
  checked_at DATE NOT NULL,
  checker TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_events_entity
  ON verification_events (entity_type, entity_id, field_key);

COMMENT ON TABLE verification_events IS
  'One row per real check. last_verified_at elsewhere may be copied from this table by scripts/record-verification.mjs. Never written at render time.';

CREATE TABLE IF NOT EXISTS university_ratings (
  id BIGSERIAL PRIMARY KEY,
  university_slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ranking', 'category')),
  authority TEXT NOT NULL,
  year TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT,
  last_verified_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_university_ratings_slug ON university_ratings (university_slug);

COMMENT ON TABLE university_ratings IS
  'Rankings and categories. kind=category for HEC ORIC W/X/Y (research-office evaluation, not an overall ranking).';

CREATE TABLE IF NOT EXISTS field_conflicts (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_conflicts_entity ON field_conflicts (entity_type, entity_id, field_key);

COMMENT ON TABLE field_conflicts IS
  'Competing values for one field. Display the primary value only when it is verified; always show alternatives.';

CREATE TABLE IF NOT EXISTS content_reports (
  id BIGSERIAL PRIMARY KEY,
  page_path TEXT,
  entity_type TEXT,
  entity_id TEXT,
  field_key TEXT,
  message TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE content_reports IS
  'Public "report incorrect information" submissions. No marks or budget data.';

COMMIT;
