-- =====================================================
-- Migration 0005: Fix Profile Creation with Trigger
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Automatically create profiles when users sign up
-- =====================================================

-- =====================================================
-- DROP EXISTING TRIGGER IF EXISTS
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS handle_new_user ();

-- =====================================================
-- CREATE FUNCTION TO HANDLE NEW USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  user_grade_level INTEGER;
BEGIN
  -- Extract metadata from raw_user_meta_data
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد');
  user_grade_level := (NEW.raw_user_meta_data->>'grade_level')::INTEGER;
  
  -- Validate role
  IF user_role NOT IN ('admin', 'student', 'parent') THEN
    user_role := 'student';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, role, grade_level, created_at, updated_at)
  VALUES (
    NEW.id,
    user_full_name,
    user_role,
    user_grade_level,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGER ON AUTH.USERS
-- =====================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ADD INSERT POLICY FOR PROFILES (FALLBACK)
-- =====================================================
-- This policy allows users to insert their own profile
-- if the trigger fails or for manual profile creation
CREATE POLICY user_insert_own_profile ON profiles FOR
INSERT
WITH
    CHECK (auth.uid () = id);

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================
-- Ensure the trigger function can access auth schema
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ BEGIN RAISE NOTICE 'Migration 0005 completed successfully: Profile creation trigger added';

RAISE NOTICE 'Profiles will now be created automatically when users sign up';

END $$;