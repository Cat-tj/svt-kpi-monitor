-- =============================================================================
-- Migration: KPI Scheduling (start date, deadline, assignee)
-- =============================================================================
-- Adds project/task scheduling to KPIs so each KPI can have a start date,
-- a deadline (due date), and a person it is assigned to. These power the
-- Activity Calendar's task spans and the project/person/department filters.
--
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query).
-- Safe to run multiple times (idempotent).
-- =============================================================================

ALTER TABLE kpis
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date   DATE,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kpis_assigned_to ON kpis(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kpis_schedule    ON kpis(start_date, due_date);

-- Optional: keep due_date on/after start_date when both are present.
ALTER TABLE kpis DROP CONSTRAINT IF EXISTS kpis_schedule_order_chk;
ALTER TABLE kpis
  ADD CONSTRAINT kpis_schedule_order_chk
  CHECK (start_date IS NULL OR due_date IS NULL OR due_date >= start_date);

-- -----------------------------------------------------------------------------
-- Let any authenticated user read profile rows so the calendar (and other
-- team views) can show assignee names to every role. Without this, the
-- existing policies only let staff see their OWN profile, so assignee names
-- would appear blank for staff viewers.
--
-- NOTE: RLS is row-level, so this grants read access to all columns of the
-- profiles row (name, email, role, department). For a small internal company
-- tool where colleagues already know each other this is normally fine. To
-- revoke later, simply: DROP POLICY "Authenticated can view profiles" ON profiles;
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view profiles" ON profiles;
CREATE POLICY "Authenticated can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
