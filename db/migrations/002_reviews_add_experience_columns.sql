-- =============================================================================
-- 002_reviews_add_experience_columns.sql
-- The application code (reviews-store.ts) writes to `positive_experiences`
-- and `common_complaints`, but these columns were missing from the original
-- schema.  Additionally, `title` and `body` were declared NOT NULL but the
-- code never populates them.
--
--   * positive_experiences  — free-text positives (mirrors RawReview type)
--   * common_complaints     — free-text negatives (mirrors RawReview type)
--   * title, body           — relax NOT NULL → add defaults so existing
--                              INSERT paths continue to work
--
-- Idempotent: safe to run multiple times (IF NOT EXISTS / SET DEFAULT).
-- =============================================================================

-- Add the two missing experience columns
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS positive_experiences TEXT,
  ADD COLUMN IF NOT EXISTS common_complaints TEXT;

-- Relax title and body so the current code path (which doesn't set them)
-- no longer violates NOT NULL constraints.
ALTER TABLE reviews ALTER COLUMN title SET DEFAULT '';
ALTER TABLE reviews ALTER COLUMN body SET DEFAULT '';

-- Backfill any existing rows that might have empty titles/bodies
UPDATE reviews SET title = DEFAULT WHERE title IS NULL;
UPDATE reviews SET body  = DEFAULT WHERE body  IS NULL;

-- Drop the old NOT NULL constraint if it exists, then re-add with the default
ALTER TABLE reviews ALTER COLUMN title DROP NOT NULL;
ALTER TABLE reviews ALTER COLUMN body  DROP NOT NULL;
