-- Delete the broken user
DELETE FROM profiles WHERE id = '806ed679-7f59-45c6-b23f-1761ed4b085d';
DELETE FROM auth.users WHERE id = '806ed679-7f59-45c6-b23f-1761ed4b085d';

-- Drop the trigger temporarily so we can create user via Admin API
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
