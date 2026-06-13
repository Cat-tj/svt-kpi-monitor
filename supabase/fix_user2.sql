-- Insert profile for the new user
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  '6bef5500-afc5-4ed2-b1f6-2838c3b2f704',
  'COO Admin',
  'admin@sentravisi.com',
  'admin'
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
