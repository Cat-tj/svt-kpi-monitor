-- =============================================================================
-- Migration: Issue, Priority, Output fields on kpi_entries
-- =============================================================================
-- Adds issue tracking and output/outcome fields to KPI entries.
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- =============================================================================

-- Priority enum
DO $$ BEGIN CREATE TYPE entry_priority AS ENUM ('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- New columns
ALTER TABLE kpi_entries ADD COLUMN IF NOT EXISTS issue TEXT;
ALTER TABLE kpi_entries ADD COLUMN IF NOT EXISTS priority entry_priority;
ALTER TABLE kpi_entries ADD COLUMN IF NOT EXISTS output TEXT;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
