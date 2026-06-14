-- =============================================================================
-- PT CHIEF LEVEL INDONESIA — KPI Monitor: COMPLETE SETUP (idempotent)
-- =============================================================================
-- Run this ONCE in Supabase > SQL Editor on project ftsfxxjyukbelgjtvmdo.
-- Safe to re-run: it creates only what's missing, fixes RLS, and seeds sample
-- data. It does NOT drop tables or delete your data.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS (create if missing)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE user_role     AS ENUM ('admin','manager','staff');            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kpi_type      AS ENUM ('percentage','currency','numerical');  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kpi_timeframe AS ENUM ('weekly','monthly','annually');        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE entry_status  AS ENUM ('pending','approved','rejected');       EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CORE TABLES (create if missing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'staff',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  type kpi_type NOT NULL DEFAULT 'numerical',
  timeframe kpi_timeframe NOT NULL DEFAULT 'monthly',
  target_value NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 100),
  unit TEXT,
  start_date DATE,
  due_date DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- In case kpis already existed without the scheduling columns:
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS start_date  DATE;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS due_date    DATE;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE kpis DROP CONSTRAINT IF EXISTS kpis_schedule_order_chk;
ALTER TABLE kpis ADD CONSTRAINT kpis_schedule_order_chk
  CHECK (start_date IS NULL OR due_date IS NULL OR due_date >= start_date);

CREATE TABLE IF NOT EXISTS sub_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kpi_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  sub_kpi_id UUID REFERENCES sub_kpis(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_value NUMERIC NOT NULL,
  notes TEXT,
  status entry_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  score NUMERIC CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kpi_id, sub_kpi_id, submitted_by, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  content JSONB NOT NULL,
  department_id UUID REFERENCES departments(id),
  generated_by TEXT NOT NULL DEFAULT 'openclaw',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_department      ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role            ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_kpis_department          ON kpis(department_id);
CREATE INDEX IF NOT EXISTS idx_kpis_assigned_to         ON kpis(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kpis_schedule            ON kpis(start_date, due_date);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_kpi          ON kpi_entries(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_submitted_by ON kpi_entries(submitted_by);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_status       ON kpi_entries(status);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_period       ON kpi_entries(period_start, period_end);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SECURITY DEFINER HELPERS (avoid RLS recursion) + aliases
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_user_department()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$;

-- Aliases (some older policies/code may call these names)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_department()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ENABLE RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE departments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_kpis     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys     ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RESET + CREATE POLICIES (non-recursive)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY "profiles_own"          ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_read"   ON profiles FOR SELECT TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "profiles_manager_dept" ON profiles FOR SELECT TO authenticated USING (auth_user_role() = 'manager' AND department_id = auth_user_department());
-- Let any authenticated colleague read profiles (needed for assignee names in calendar/team).
CREATE POLICY "profiles_authenticated_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_admin_all"    ON profiles FOR ALL    TO authenticated USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- DEPARTMENTS
CREATE POLICY "departments_read"  ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_admin" ON departments FOR ALL    TO authenticated USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- KPIS
CREATE POLICY "kpis_read"    ON kpis FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "kpis_admin"   ON kpis FOR ALL    TO authenticated USING (auth_user_role() = 'admin')  WITH CHECK (auth_user_role() = 'admin');
CREATE POLICY "kpis_manager" ON kpis FOR ALL    TO authenticated USING (auth_user_role() = 'manager' AND department_id = auth_user_department()) WITH CHECK (auth_user_role() = 'manager' AND department_id = auth_user_department());

-- SUB_KPIS
CREATE POLICY "sub_kpis_read"  ON sub_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "sub_kpis_admin" ON sub_kpis FOR ALL    TO authenticated USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- KPI_ENTRIES
CREATE POLICY "entries_insert"         ON kpi_entries FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "entries_read_own"       ON kpi_entries FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "entries_update_own"     ON kpi_entries FOR UPDATE TO authenticated USING (submitted_by = auth.uid() AND status = 'pending') WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "entries_read_manager"   ON kpi_entries FOR SELECT TO authenticated USING (auth_user_role() = 'manager' AND kpi_id IN (SELECT id FROM kpis WHERE department_id = auth_user_department()));
CREATE POLICY "entries_update_manager" ON kpi_entries FOR UPDATE TO authenticated USING (auth_user_role() = 'manager' AND kpi_id IN (SELECT id FROM kpis WHERE department_id = auth_user_department()));
CREATE POLICY "entries_admin"          ON kpi_entries FOR ALL    TO authenticated USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- AI_REPORTS
CREATE POLICY "reports_admin"   ON ai_reports FOR ALL    TO authenticated USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');
CREATE POLICY "reports_manager" ON ai_reports FOR SELECT TO authenticated USING (auth_user_role() = 'manager' AND (department_id IS NULL OR department_id = auth_user_department()));

-- API_KEYS
CREATE POLICY "api_keys_admin" ON api_keys FOR ALL TO authenticated USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TRIGGERS (updated_at + auto-create profile on signup)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles    ON profiles;
DROP TRIGGER IF EXISTS set_updated_at_departments ON departments;
DROP TRIGGER IF EXISTS set_updated_at_kpis        ON kpis;
DROP TRIGGER IF EXISTS set_updated_at_sub_kpis    ON sub_kpis;
DROP TRIGGER IF EXISTS set_updated_at_kpi_entries ON kpi_entries;
CREATE TRIGGER set_updated_at_profiles    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_departments BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_kpis        BEFORE UPDATE ON kpis        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_sub_kpis    BEFORE UPDATE ON sub_kpis    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_kpi_entries BEFORE UPDATE ON kpi_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. GRANTS (baseline access for PostgREST; RLS still restricts rows)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. SEED: departments
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO departments (id, name, description) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Engineering', 'Software engineering team'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Sales',       'Sales & business development'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Operations',  'Operations & support')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. PROMOTE existing logged-in user(s) to admin so you can manage KPIs.
--     Creates a profile for every existing auth user and sets role = admin.
--     (Adjust later in the Team page if needed.)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO profiles (id, full_name, email, role)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), u.email, 'admin'
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. SEED: sample scheduled KPIs (so the Calendar shows tasks immediately)
--     Dates are relative to today: one upcoming, one in-progress, one overdue.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO kpis (name, description, department_id, type, timeframe, target_value, weight, unit, start_date, due_date)
SELECT * FROM (VALUES
  ('Website Revamp',    'Redesign company website', 'a1b2c3d4-0000-0000-0000-000000000001'::uuid, 'percentage'::kpi_type, 'monthly'::kpi_timeframe, 100::numeric,       20::numeric, '%',   (CURRENT_DATE - 3),  (CURRENT_DATE + 10)),
  ('Q3 Sales Campaign', 'Outbound campaign for Q3', 'a1b2c3d4-0000-0000-0000-000000000002'::uuid, 'currency'::kpi_type,   'monthly'::kpi_timeframe, 500000000::numeric, 25::numeric, 'IDR', (CURRENT_DATE + 2),  (CURRENT_DATE + 20)),
  ('Server Migration',  'Move infra to new region', 'a1b2c3d4-0000-0000-0000-000000000003'::uuid, 'percentage'::kpi_type, 'monthly'::kpi_timeframe, 100::numeric,       15::numeric, '%',   (CURRENT_DATE - 14), (CURRENT_DATE - 1))
) AS v(name, description, department_id, type, timeframe, target_value, weight, unit, start_date, due_date)
WHERE NOT EXISTS (SELECT 1 FROM kpis k WHERE k.name = v.name);

-- Done. Reload the app — Calendar should now show the three sample tasks.
