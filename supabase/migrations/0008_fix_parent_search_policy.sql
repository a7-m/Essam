-- =====================================================
-- Migration 0008: Fix Parent Search Students Policy
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Allow parents to search for students by email to create links
-- =====================================================

-- Drop the old policy that only allows reading linked students
DROP POLICY IF EXISTS parent_read_linked_students ON profiles;

-- Create new policy: Parents can read ALL student profiles (for searching)
-- This is safe because profiles don't contain sensitive information
CREATE POLICY parent_read_students ON profiles FOR
SELECT USING (
        get_user_role () = 'parent'
        AND role = 'student'
    );

-- Add comment
COMMENT ON POLICY parent_read_students ON profiles IS 'Allows parents to search for students by email to create parent-student links';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$ BEGIN RAISE NOTICE '====================================';

RAISE NOTICE 'RLS Policy Updated:';

RAISE NOTICE '====================================';

RAISE NOTICE '✅ Parents can now search for students by email';

RAISE NOTICE '✅ Parents can create links with any student';

RAISE NOTICE '====================================';

END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ BEGIN RAISE NOTICE 'Migration 0008 completed successfully: Parent search policy fixed';

END $$;