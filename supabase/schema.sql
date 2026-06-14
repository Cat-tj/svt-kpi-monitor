-- =============================================================================
-- PT CHIEF LEVEL INDONESIA - KPI Monitoring System
-- Database Schema & Row-Level Security (RLS) Policies
-- =============================================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE kpi_type AS ENUM ('percentage', 'currency', 'numerical');
CREATE TYPE kpi_timeframe AS ENUM ('weekly', 'monthly', 'annually');
CREATE TYPE entry_status AS ENUM ('pending', 'approved', 'rejected');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
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

-- KPIs (top-level metrics)
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  type kpi_type NOT NULL DEFAULT 'numerical',
  timeframe kpi_timeframe NOT NULL DEFAULT 'monthly',
  target_value NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 100),
  unit TEXT, -- e.g., '%', 'IDR', 'units'
  -- Task/project scheduling (for the Activity Calendar)
  start_date DATE,
  due_date DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT kpis_schedule_order_chk
    CHECK (start_date IS NULL OR due_date IS NULL OR due_date >= start_date)
);

-- Sub-KPIs (breakdown of a parent KPI)
CREATE TABLE sub_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- KPI Entries (staff submissions)
CREATE TABLE kpi_entries (
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
  -- Reviewer-assigned work score 0–100% (set by manager/admin on approval)
  score NUMERIC CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Prevent duplicate entries for same KPI/period/user
  UNIQUE(kpi_id, sub_kpi_id, submitted_by, period_start, period_end)
);

-- AI Reports (pushed back from OpenClaw agents)
CREATE TABLE ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'trend_analysis', 'anomaly_alert', 'weekly_summary'
  content JSONB NOT NULL, -- flexible report payload
  department_id UUID REFERENCES departments(id),
  generated_by TEXT NOT NULL DEFAULT 'openclaw', -- agent identifier
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Keys for external agent access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- store hashed, never plaintext
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

CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_kpis_department ON kpis(department_id);
CREATE INDEX idx_kpis_assigned_to ON kpis(assigned_to);
CREATE INDEX idx_kpis_schedule ON kpis(start_date, due_date);
CREATE INDEX idx_kpi_entries_kpi ON kpi_entries(kpi_id);
CREATE INDEX idx_kpi_entries_submitted_by ON kpi_entries(submitted_by);
CREATE INDEX idx_kpi_entries_status ON kpi_entries(status);
CREATE INDEX idx_kpi_entries_period ON kpi_entries(period_start, period_end);
CREATE INDEX idx_ai_reports_department ON ai_reports(department_id);
CREATE INDEX idx_ai_reports_created ON ai_reports(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW-LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ──
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Managers can view their department profiles"
  ON profiles FOR SELECT USING (
    get_user_role() = 'manager' AND department_id = get_user_department()
  );

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL USING (get_user_role() = 'admin');

-- ── DEPARTMENTS ──
CREATE POLICY "Everyone can view departments"
  ON departments FOR SELECT USING (true);

CREATE POLICY "Only admins can manage departments"
  ON departments FOR ALL USING (get_user_role() = 'admin');

-- ── KPIs ──
CREATE POLICY "Everyone can view active KPIs"
  ON kpis FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all KPIs"
  ON kpis FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Managers can manage their department KPIs"
  ON kpis FOR ALL USING (
    get_user_role() = 'manager' AND department_id = get_user_department()
  );

-- ── SUB-KPIs ──
CREATE POLICY "Everyone can view sub-KPIs"
  ON sub_kpis FOR SELECT USING (true);

CREATE POLICY "Admins can manage sub-KPIs"
  ON sub_kpis FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Managers can manage sub-KPIs for their department"
  ON sub_kpis FOR ALL USING (
    get_user_role() = 'manager' AND EXISTS (
      SELECT 1 FROM kpis WHERE kpis.id = sub_kpis.kpi_id
      AND kpis.department_id = get_user_department()
    )
  );

-- ── KPI ENTRIES ──
CREATE POLICY "Staff can view their own entries"
  ON kpi_entries FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Staff can create their own entries"
  ON kpi_entries FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Staff can update their pending entries"
  ON kpi_entries FOR UPDATE USING (
    submitted_by = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Managers can view their department entries"
  ON kpi_entries FOR SELECT USING (
    get_user_role() = 'manager' AND EXISTS (
      SELECT 1 FROM kpis WHERE kpis.id = kpi_entries.kpi_id
      AND kpis.department_id = get_user_department()
    )
  );

CREATE POLICY "Managers can approve/reject department entries"
  ON kpi_entries FOR UPDATE USING (
    get_user_role() = 'manager' AND EXISTS (
      SELECT 1 FROM kpis WHERE kpis.id = kpi_entries.kpi_id
      AND kpis.department_id = get_user_department()
    )
  );

CREATE POLICY "Admins can manage all entries"
  ON kpi_entries FOR ALL USING (get_user_role() = 'admin');

-- ── AI REPORTS ──
CREATE POLICY "Admins can view all reports"
  ON ai_reports FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Managers can view their department reports"
  ON ai_reports FOR SELECT USING (
    get_user_role() = 'manager' AND (
      department_id = get_user_department() OR department_id IS NULL
    )
  );

CREATE POLICY "Service role can insert reports"
  ON ai_reports FOR INSERT WITH CHECK (true);

-- ── API KEYS ──
CREATE POLICY "Only admins can manage API keys"
  ON api_keys FOR ALL USING (get_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AUTO-UPDATE TIMESTAMPS TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_departments
  BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_kpis
  BEFORE UPDATE ON kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_sub_kpis
  BEFORE UPDATE ON sub_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_kpi_entries
  BEFORE UPDATE ON kpi_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
