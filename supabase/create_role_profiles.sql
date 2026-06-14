-- Manager profile
INSERT INTO profiles (id, full_name, email, role, department_id)
VALUES (
  'daa70758-b062-4e35-82f6-929259040b39',
  'Andi Setiawan',
  'manager@chieflevel.co.id',
  'manager',
  'a1b2c3d4-0000-0000-0000-000000000001'
);

-- Staff profile
INSERT INTO profiles (id, full_name, email, role, department_id)
VALUES (
  '581c6b34-fe75-444a-b45a-c7a154705691',
  'Fajar Nugroho',
  'staff@chieflevel.co.id',
  'staff',
  'a1b2c3d4-0000-0000-0000-000000000001'
);

-- Restore the trigger
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
