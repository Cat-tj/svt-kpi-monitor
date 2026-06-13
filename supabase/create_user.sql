-- Create admin user for login
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@sentravisi.com',
  crypt('Admin123!', gen_salt('bf')),
  now(), now(), now(), '',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "COO Admin"}'::jsonb,
  false
) RETURNING id, email;
