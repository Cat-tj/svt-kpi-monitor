-- =============================================================================
-- COMPLETE RLS OVERHAUL - Fix all access issues
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. DROP ALL EXISTING POLICIES (clean slate)
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
-- 2. PROFILES - Everyone must be able to read their own profile
-- ═══════════════════════════════════════════════════════════════════════════════

-- Any authenticated user can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Managers can read profiles in their department
CREATE POLICY "profiles_select_manager_dept"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- Admins can do everything with profiles
CREATE POLICY "profiles_all_admin"
  ON profiles FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. DEPARTMENTS - Everyone can read
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "departments_select_all"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "departments_manage_admin"
  ON departments FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. KPIs - Everyone can read active KPIs
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "kpis_select_all"
  ON kpis FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "kpis_manage_admin"
  ON kpis FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "kpis_manage_manager"
  ON kpis FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SUB-KPIs - Everyone can read
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "sub_kpis_select_all"
  ON sub_kpis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sub_kpis_manage_admin"
  ON sub_kpis FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. KPI ENTRIES - The most critical table for staff
-- ═══════════════════════════════════════════════════════════════════════════════

-- Staff/Manager/Admin can INSERT their own entries
CREATE POLICY "entries_insert_own"
  ON kpi_entries FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Staff can SELECT their own entries
CREATE POLICY "entries_select_own"
  ON kpi_entries FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- Staff can UPDATE their own PENDING entries
CREATE POLICY "entries_update_own_pending"
  ON kpi_entries FOR UPDATE
  TO authenticated
  USING (submitted_by = auth.uid() AND status = 'pending')
  WITH CHECK (submitted_by = auth.uid());

-- Managers can SELECT all entries for KPIs in their department
CREATE POLICY "entries_select_manager"
  ON kpi_entries FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND kpi_id IN (
      SELECT id FROM kpis WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Managers can UPDATE (approve/reject) entries for their department KPIs
CREATE POLICY "entries_update_manager"
  ON kpi_entries FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND kpi_id IN (
      SELECT id FROM kpis WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
  );

-- Admins can do everything with entries
CREATE POLICY "entries_all_admin"
  ON kpi_entries FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. AI REPORTS - Admins and managers can read
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "ai_reports_select_admin"
  ON ai_reports FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "ai_reports_select_manager"
  ON ai_reports FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND (department_id IS NULL OR department_id = (SELECT department_id FROM profiles WHERE id = auth.uid()))
  );

-- Service role bypass for inserts (webhooks)
CREATE POLICY "ai_reports_insert_service"
  ON ai_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. API KEYS - Admin only
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "api_keys_admin_only"
  ON api_keys FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
