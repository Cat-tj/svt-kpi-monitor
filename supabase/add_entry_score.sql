-- ─────────────────────────────────────────────────────────────────────────────
-- Add reviewer "work score" to KPI entries
-- The lead/manager gives a score (0–100%) when approving an entry, indicating
-- how well the submitted work meets expectations (100% = fully meets target).
-- Run this in the Supabase SQL Editor against an existing database.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE kpi_entries
  ADD COLUMN IF NOT EXISTS score NUMERIC
  CHECK (score IS NULL OR (score >= 0 AND score <= 100));

COMMENT ON COLUMN kpi_entries.score IS
  'Reviewer-assigned work score 0–100%. Set by the manager/admin on approval.';
