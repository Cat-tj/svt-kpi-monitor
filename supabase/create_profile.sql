-- Create admin profile
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  '806ed679-7f59-45c6-b23f-1761ed4b085d',
  'COO Admin',
  'admin@sentravisi.com',
  'admin'
);

-- Recreate the trigger for future users
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
