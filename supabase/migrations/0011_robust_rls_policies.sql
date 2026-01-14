-- =====================================================
-- Migration 0011: Robust RLS Policies
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Improve is_admin check and fix subjects RLS
-- =====================================================

-- 1. Redefine is_admin to check JWT metadata first
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check JWT metadata first (fast and reliable)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Fallback to profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure get_user_role and get_user_grade are schema-qualified
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_grade()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT grade_level FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix subjects policies by dropping and recreating
DROP POLICY IF EXISTS admin_subjects_all ON public.subjects;
DROP POLICY IF EXISTS student_read_subjects ON public.subjects;
DROP POLICY IF EXISTS parent_read_subjects ON public.subjects;

CREATE POLICY admin_subjects_all ON public.subjects FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY student_read_subjects ON public.subjects FOR SELECT 
USING (grade_level = public.get_user_grade());

CREATE POLICY parent_read_subjects ON public.subjects FOR SELECT 
USING (
    public.get_user_role() = 'parent'
    AND grade_level IN (
        SELECT p.grade_level
        FROM public.profiles p
        JOIN public.parent_student_links psl ON p.id = psl.student_id
        WHERE psl.parent_id = auth.uid() AND psl.status = 'approved'
    )
);

-- 4. Fix potential circular dependency in profiles policy
DROP POLICY IF EXISTS admin_profiles_all ON public.profiles;
CREATE POLICY admin_profiles_all ON public.profiles FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Success Message
DO $$ BEGIN 
  RAISE NOTICE 'Migration 0011 completed successfully: Robust RLS policies applied';
END $$;
