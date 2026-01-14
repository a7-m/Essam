-- =====================================================
-- Admin Bootstrap Script
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Create the first admin account
-- =====================================================

-- ⚠️ IMPORTANT INSTRUCTIONS:
-- 1. First, create a user in Supabase Auth Dashboard with:
--    - Email: admin@essam-platform.com (or your preferred email)
--    - Password: [Set a strong password]
--
-- 2. Get the UUID of that user from auth.users table
--
-- 3. Replace 'YOUR_ADMIN_USER_UUID_HERE' below with the actual UUID
--
-- 4. Run this script in Supabase SQL Editor

-- =====================================================
-- INSERT ADMIN PROFILE
-- =====================================================

-- Replace with actual UUID from auth.users
INSERT INTO profiles (id, full_name, role, grade_level)
VALUES (
  'YOUR_ADMIN_USER_UUID_HERE'::uuid,  -- ⚠️ REPLACE THIS
  'الأستاذ عصام عبدالمنعم',
  'admin',
  NULL  -- Admin doesn't have a grade level
)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- =====================================================
-- VERIFY ADMIN CREATION
-- =====================================================

DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM profiles
  WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE NOTICE '✅ Admin account created successfully!';
    RAISE NOTICE 'Total admin accounts: %', admin_count;
  ELSE
    RAISE WARNING '⚠️ No admin account found. Please check the UUID and try again.';
  END IF;
END $$;

-- =====================================================
-- ALTERNATIVE: Create Admin via Function (Recommended)
-- =====================================================

-- This function allows creating admin from the application
-- Admin email MUST be whitelisted for security

CREATE OR REPLACE FUNCTION create_admin_profile(
  user_uuid UUID,
  admin_name TEXT
)
RETURNS void AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Whitelist check (add your admin email here)
  IF user_email NOT IN ('admin@essam-platform.com', 'essam@example.com') THEN
    RAISE EXCEPTION 'Unauthorized: This email is not whitelisted for admin access';
  END IF;
  
  -- Create or update admin profile
  INSERT INTO profiles (id, full_name, role, grade_level)
  VALUES (user_uuid, admin_name, 'admin', NULL)
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = 'admin',
    grade_level = NULL;
    
  RAISE NOTICE 'Admin profile created for: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USAGE EXAMPLE
-- =====================================================

/*
-- After creating a user in Supabase Auth, call:
SELECT create_admin_profile(
'user-uuid-from-auth-users'::uuid,
'الأستاذ عصام عبدالمنعم'
);
*/

-- =====================================================
-- SECURITY NOTES
-- =====================================================

/*
🔒 SECURITY BEST PRACTICES:

1. ✅ Only create admin accounts manually via SQL
2. ✅ Never expose admin creation in public-facing UI
3. ✅ Use strong passwords for admin accounts
4. ✅ Enable 2FA for admin accounts (Supabase Auth)
5. ✅ Whitelist admin emails in the create_admin_profile function
6. ✅ Regularly audit admin accounts
7. ✅ Limit admin accounts to 1-2 trusted users

⚠️ NEVER allow student or parent registration to set role = 'admin'
*/