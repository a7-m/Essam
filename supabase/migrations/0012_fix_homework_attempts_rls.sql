-- =====================================================
-- Migration 0012: Fix Homework Attempts RLS Policy
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Allow students to submit homework by fixing the UPDATE policy
-- =====================================================

-- Students: Update own attempts (must allow setting submitted_at)
DROP POLICY IF EXISTS "Students can update own incomplete homework attempts" ON homework_attempts;

CREATE POLICY "Students can update own incomplete homework attempts" ON homework_attempts 
FOR UPDATE 
TO authenticated 
USING (
    student_id = auth.uid ()
    AND submitted_at IS NULL
)
WITH CHECK (
    student_id = auth.uid ()
);

-- Success Message
DO $$ BEGIN 
  RAISE NOTICE 'Migration 0012 completed successfully: Homework attempts RLS fixed';
END $$;
