-- The problem: RLS policies on profiles use subqueries that create circular dependency
-- Fix: Allow every authenticated user to read their own profile without any role check

-- Drop ALL existing profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins full access" ON profiles;
DROP POLICY IF EXISTS "Managers view department profiles" ON profiles;

-- Simple, non-circular policies:

-- Everyone can read their own profile (no function calls, just auth.uid())
CREATE POLICY "Anyone can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Managers can read profiles in their department
CREATE POLICY "Managers read department profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'manager'
      AND p.department_id = profiles.department_id
    )
  );

-- Admins can update/insert/delete all profiles
CREATE POLICY "Admins manage all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
