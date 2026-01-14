-- =====================================================
-- Migration 0007: Verify and Fix Email Column
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Verify email column exists and populate any missing data
-- =====================================================

-- Step 1: Add email column if it doesn't exist (safe to run multiple times)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Create unique index on email (ignoring nulls)
DROP INDEX IF EXISTS idx_profiles_email;

CREATE UNIQUE INDEX idx_profiles_email ON profiles (email)
WHERE
    email IS NOT NULL;

-- Step 3: Update ALL profiles with emails from auth.users (including existing ones)
UPDATE profiles
SET
    email = auth.users.email
FROM auth.users
WHERE
    profiles.id = auth.users.id;

-- Step 4: Update the trigger to ensure new users get email field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, grade_level, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    (NEW.raw_user_meta_data->>'grade_level')::INTEGER,
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Verify the results
DO $$
DECLARE
  total_profiles INTEGER;
  profiles_with_email INTEGER;
  profiles_without_email INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO profiles_with_email FROM profiles WHERE email IS NOT NULL;
  SELECT COUNT(*) INTO profiles_without_email FROM profiles WHERE email IS NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Email Column Verification:';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Profiles with email: %', profiles_with_email;
  RAISE NOTICE 'Profiles without email: %', profiles_without_email;
  RAISE NOTICE '====================================';
  
  IF profiles_without_email > 0 THEN
    RAISE WARNING 'Some profiles still missing email addresses!';
  ELSE
    RAISE NOTICE '✅ All profiles have email addresses!';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN profiles.email IS 'User email address (synced from auth.users for easier lookups)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 0007 completed successfully: Email column verified and fixed';
END $$;