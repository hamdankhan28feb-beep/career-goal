-- =============================================================================
-- 001_important_links_student_tools.sql
-- Adds support for student-built (unofficial) important links, e.g. the
-- FAST-NUCES "Student Tools" (FAST Timetable, Campus Ride).
--
--   * description    — short blurb shown under the link label
--   * is_unofficial  — when TRUE the link is rendered in the "Student Tools"
--                      subsection with an "Unofficial — Made by FAST Students"
--                      badge, visually distinct from official links.
--
-- Idempotent: safe to run multiple times (IF NOT EXISTS / defaults).
-- =============================================================================

ALTER TABLE important_links
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_unofficial BOOLEAN NOT NULL DEFAULT FALSE;
