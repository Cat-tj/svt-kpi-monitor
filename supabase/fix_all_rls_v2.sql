-- =============================================================================
-- COMPLETE RLS FIX v2 - Eliminates infinite recursion
-- Uses SECURITY DEFINER functions to bypass RLS when checking role
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. DROP ALL EXISTING POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CREATE SECURITY DEFINER HELPER FUNCTIONS (bypass RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_user_department()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Everyone reads their own profile
CREATE POLICY "profiles_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins read all
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_role() = 'admin');

-- Managers read their department
CREATE POLICY "profiles_manager_dept" ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_role() = 'manager' AND department_id = auth_user_department());

-- Admins manage all
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. DEPARTMENTS - All authenticated users can read
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "departments_read" ON departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "departments_admin" ON departments
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. KPIs - All authenticated users can read active KPIs
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "kpis_read" ON kpis
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "kpis_admin" ON kpis
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "kpis_manager" ON kpis
  FOR ALL TO authenticated
  USING (auth_user_role() = 'manager' AND department_id = auth_user_department())
  WITH CHECK (auth_user_role() = 'manager' AND department_id = auth_user_department());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SUB_KPIs - All authenticated users can read
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "sub_kpis_read" ON sub_kpis
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "sub_kpis_admin" ON sub_kpis
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. KPI_ENTRIES - The key table
-- ═══════════════════════════════════════════════════════════════════════════════

-- Anyone can INSERT their own entries
CREATE POLICY "entries_insert" ON kpi_entries
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Anyone can read their own entries
CREATE POLICY "entries_read_own" ON kpi_entries
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- Anyone can update their own PENDING entries
CREATE POLICY "entries_update_own" ON kpi_entries
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid() AND status = 'pending')
  WITH CHECK (submitted_by = auth.uid());

-- Managers can read entries for their department's KPIs
CREATE POLICY "entries_read_manager" ON kpi_entries
  FOR SELECT TO authenticated
  USING (
    auth_user_role() = 'manager'
    AND kpi_id IN (SELECT id FROM kpis WHERE department_id = auth_user_department())
  );

-- Managers can update (approve/reject) entries for their department
CREATE POLICY "entries_update_manager" ON kpi_entries
  FOR UPDATE TO authenticated
  USING (
    auth_user_role() = 'manager'
    AND kpi_id IN (SELECT id FROM kpis WHERE department_id = auth_user_department())
  );

-- Admins have full access
CREATE POLICY "entries_admin" ON kpi_entries
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. AI_REPORTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "reports_admin" ON ai_reports
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "reports_manager" ON ai_reports
  FOR SELECT TO authenticated
  USING (
    auth_user_role() = 'manager'
    AND (department_id IS NULL OR department_id = auth_user_department())
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. API_KEYS - Admin only
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "api_keys_admin" ON api_keys
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');
