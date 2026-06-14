-- Test as staff user: simulate what the app does

-- 1. Can staff read their own profile?
SET request.jwt.claims TO '{"sub":"581c6b34-fe75-444a-b45a-c7a154705691","role":"authenticated"}';
SET role TO authenticated;

SELECT id, full_name, role FROM profiles WHERE id = '581c6b34-fe75-444a-b45a-c7a154705691';
