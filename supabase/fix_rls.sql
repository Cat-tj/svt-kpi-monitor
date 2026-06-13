-- Fix RLS circular dependency on profiles table
-- The issue: get_user_role() queries profiles, but profiles RLS uses get_user_role()

-- Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can view their department profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Recreate with simpler, non-circular policies
-- Allow users to always see their own profile (no function call needed)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

-- Allow admins full access (use subquery instead of function to avoid circular dep)
CREATE POLICY "Admins full access"
  ON profiles FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow managers to see their department
CREATE POLICY "Managers view department profiles"
  ON profiles FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- Also fix the helper functions to be more resilient
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'staff'::user_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
