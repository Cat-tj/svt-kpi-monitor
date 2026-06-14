-- Test 1: Staff can read own profile
SELECT 'TEST 1: Staff reads own profile' as test;
SELECT id, full_name, role FROM profiles WHERE id = '581c6b34-fe75-444a-b45a-c7a154705691';

-- Test 2: Staff can read KPIs
SELECT 'TEST 2: Staff reads KPIs' as test;
SELECT id, name, target_value FROM kpis WHERE is_active = true LIMIT 3;

-- Test 3: Staff can read departments
SELECT 'TEST 3: Departments' as test;
SELECT id, name FROM departments;

-- Test 4: Test the helper functions work
SELECT 'TEST 4: Helper functions' as test;
SELECT auth_user_role() as role_check;
