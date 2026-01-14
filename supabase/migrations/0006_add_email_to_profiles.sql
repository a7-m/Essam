-- =====================================================
-- Migration 0006: Add Email to Profiles
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Add email column to profiles table for easier lookups
-- =====================================================

-- Add email column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

-- Update existing profiles with emails from auth.users
UPDATE profiles
SET
    email = auth.users.email
FROM auth.users
WHERE
    profiles.id = auth.users.id
    AND profiles.email IS NULL;

-- =====================================================
-- UPDATED TRIGGER: Auto-create profile on signup
-- =====================================================
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON COLUMN profiles.email IS 'User email address (copied from auth.users for easier lookups)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 0006 completed successfully: Email column added to profiles';
END $$;