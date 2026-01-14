-- =====================================================
-- Migration 0004: Row Level Security Policies
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Secure all tables with role-based access policies
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user grade level
CREATE OR REPLACE FUNCTION get_user_grade()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT grade_level FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if parent is linked to student
CREATE OR REPLACE FUNCTION is_linked_parent(student_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM parent_student_links
    WHERE parent_id = auth.uid() 
      AND student_id = student_uuid
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_profiles_all ON profiles FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Read and update own profile
CREATE POLICY student_read_own_profile ON profiles FOR
SELECT USING (
        id = auth.uid ()
        AND role = 'student'
    );

CREATE POLICY student_update_own_profile ON profiles FOR
UPDATE USING (
    id = auth.uid ()
    AND role = 'student'
)
WITH
    CHECK (
        id = auth.uid ()
        AND role = 'student'
    );

-- Parents: Read and update own profile
CREATE POLICY parent_read_own_profile ON profiles FOR
SELECT USING (
        id = auth.uid ()
        AND role = 'parent'
    );

CREATE POLICY parent_update_own_profile ON profiles FOR
UPDATE USING (
    id = auth.uid ()
    AND role = 'parent'
)
WITH
    CHECK (
        id = auth.uid ()
        AND role = 'parent'
    );

-- Parents: Read linked students
CREATE POLICY parent_read_linked_students ON profiles FOR
SELECT USING (
        role = 'student'
        AND id IN (
            SELECT student_id
            FROM parent_student_links
            WHERE
                parent_id = auth.uid ()
                AND status = 'approved'
        )
    );

-- =====================================================
-- PARENT-STUDENT LINKS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_links_all ON parent_student_links FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Parents: Create link requests
CREATE POLICY parent_create_link ON parent_student_links FOR
INSERT
WITH
    CHECK (parent_id = auth.uid ());

-- Parents: View own links
CREATE POLICY parent_read_links ON parent_student_links FOR
SELECT USING (parent_id = auth.uid ());

-- Students: View and approve link requests
CREATE POLICY student_read_links ON parent_student_links FOR
SELECT USING (student_id = auth.uid ());

CREATE POLICY student_approve_links ON parent_student_links FOR
UPDATE USING (student_id = auth.uid ())
WITH
    CHECK (student_id = auth.uid ());

-- =====================================================
-- SUBJECTS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_subjects_all ON subjects FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Read subjects for their grade
CREATE POLICY student_read_subjects ON subjects FOR
SELECT USING (
        grade_level = get_user_grade ()
    );

-- Parents: Read subjects (for linked students)
CREATE POLICY parent_read_subjects ON subjects FOR
SELECT USING (
        get_user_role () = 'parent'
        AND grade_level IN (
            SELECT p.grade_level
            FROM
                profiles p
                JOIN parent_student_links psl ON p.id = psl.student_id
            WHERE
                psl.parent_id = auth.uid ()
                AND psl.status = 'approved'
        )
    );

-- =====================================================
-- UNITS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_units_all ON units FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Read units for accessible subjects
CREATE POLICY student_read_units ON units FOR
SELECT USING (
        subject_id IN (
            SELECT id
            FROM subjects
            WHERE
                grade_level = get_user_grade ()
        )
    );

-- Parents: Read units (for linked students' subjects)
CREATE POLICY parent_read_units ON units FOR
SELECT USING (
        get_user_role () = 'parent'
        AND subject_id IN (
            SELECT s.id
            FROM
                subjects s
                JOIN profiles p ON s.grade_level = p.grade_level
                JOIN parent_student_links psl ON p.id = psl.student_id
            WHERE
                psl.parent_id = auth.uid ()
                AND psl.status = 'approved'
        )
    );

-- =====================================================
-- LESSONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_lessons_all ON lessons FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Read published lessons only
CREATE POLICY student_read_lessons ON lessons FOR
SELECT USING (
        is_published = TRUE
        AND unit_id IN (
            SELECT u.id
            FROM units u
                JOIN subjects s ON u.subject_id = s.id
            WHERE
                s.grade_level = get_user_grade ()
        )
    );

-- Parents: Read lessons (for linked students)
CREATE POLICY parent_read_lessons ON lessons FOR
SELECT USING (
        is_published = TRUE
        AND get_user_role () = 'parent'
        AND unit_id IN (
            SELECT u.id
            FROM
                units u
                JOIN subjects s ON u.subject_id = s.id
                JOIN profiles p ON s.grade_level = p.grade_level
                JOIN parent_student_links psl ON p.id = psl.student_id
            WHERE
                psl.parent_id = auth.uid ()
                AND psl.status = 'approved'
        )
    );

-- =====================================================
-- FILES POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_files_all ON files FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Read files from accessible lessons
CREATE POLICY student_read_files ON files FOR
SELECT USING (
        lesson_id IN (
            SELECT l.id
            FROM
                lessons l
                JOIN units u ON l.unit_id = u.id
                JOIN subjects s ON u.subject_id = s.id
            WHERE
                s.grade_level = get_user_grade ()
                AND l.is_published = TRUE
        )
    );

-- Parents: Read files (for linked students' lessons)
CREATE POLICY parent_read_files ON files FOR
SELECT USING (
        get_user_role () = 'parent'
        AND lesson_id IN (
            SELECT l.id
            FROM
                lessons l
                JOIN units u ON l.unit_id = u.id
                JOIN subjects s ON u.subject_id = s.id
                JOIN profiles p ON s.grade_level = p.grade_level
                JOIN parent_student_links psl ON p.id = psl.student_id
            WHERE
                psl.parent_id = auth.uid ()
                AND psl.status = 'approved'
                AND l.is_published = TRUE
        )
    );

-- =====================================================
-- QUESTION BANK POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_questions_all ON question_bank FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students and Parents: No direct access (questions accessed through exams only)

-- =====================================================
-- EXAMS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_exams_all ON exams FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Read published exams for their grade
CREATE POLICY student_read_exams ON exams FOR
SELECT USING (
        is_published = TRUE
        AND grade_level = get_user_grade ()
        AND (
            starts_at IS NULL
            OR starts_at <= NOW()
        )
        AND (
            ends_at IS NULL
            OR ends_at >= NOW()
        )
    );

-- Parents: Read exams (for linked students)
CREATE POLICY parent_read_exams ON exams FOR
SELECT USING (
        get_user_role () = 'parent'
        AND grade_level IN (
            SELECT p.grade_level
            FROM
                profiles p
                JOIN parent_student_links psl ON p.id = psl.student_id
            WHERE
                psl.parent_id = auth.uid ()
                AND psl.status = 'approved'
        )
    );

-- =====================================================
-- EXAM QUESTIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_exam_questions_all ON exam_questions FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Read questions for exams they can access
CREATE POLICY student_read_exam_questions ON exam_questions FOR
SELECT USING (
        exam_id IN (
            SELECT id
            FROM exams
            WHERE
                is_published = TRUE
                AND grade_level = get_user_grade ()
                AND (
                    starts_at IS NULL
                    OR starts_at <= NOW()
                )
                AND (
                    ends_at IS NULL
                    OR ends_at >= NOW()
                )
        )
    );

-- =====================================================
-- EXAM ATTEMPTS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY admin_attempts_all ON exam_attempts FOR ALL USING (is_admin ())
WITH
    CHECK (is_admin ());

-- Students: Insert own attempts
CREATE POLICY student_create_attempt ON exam_attempts FOR
INSERT
WITH
    CHECK (
        student_id = auth.uid ()
        AND
        -- Verify exam is accessible
        exam_id IN (
            SELECT id
            FROM exams
            WHERE
                is_published = TRUE
                AND grade_level = get_user_grade ()
                AND (
                    starts_at IS NULL
                    OR starts_at <= NOW()
                )
                AND (
                    ends_at IS NULL
                    OR ends_at >= NOW()
                )
        )
        AND
        -- Check max attempts not exceeded
        (
            SELECT COUNT(*)
            FROM exam_attempts
            WHERE
                exam_id = exam_attempts.exam_id
                AND student_id = auth.uid ()
                AND submitted_at IS NOT NULL
        ) < (
            SELECT max_attempts
            FROM exams
            WHERE
                id = exam_attempts.exam_id
        )
    );

-- Students: Update own attempts (only before submission)
CREATE POLICY student_update_attempt ON exam_attempts FOR
UPDATE USING (
    student_id = auth.uid ()
    AND submitted_at IS NULL
)
WITH
    CHECK (student_id = auth.uid ());

-- Students: Read own attempts
CREATE POLICY student_read_attempts ON exam_attempts FOR
SELECT USING (student_id = auth.uid ());

-- Parents: Read attempts of linked students
CREATE POLICY parent_read_attempts ON exam_attempts FOR
SELECT USING (is_linked_parent (student_id));

-- =====================================================
-- STORAGE POLICIES (for lesson files)
-- =====================================================

-- Note: Storage policies are managed separately in Supabase Storage UI
-- or via the dashboard. Here's the reference SQL for documentation:

/*
-- Admin: Upload files
CREATE POLICY admin_upload_files ON storage.objects
FOR INSERT
WITH CHECK (
bucket_id = 'lesson-files' AND
auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Admin: Delete files
CREATE POLICY admin_delete_files ON storage.objects
FOR DELETE
USING (
bucket_id = 'lesson-files' AND
auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Students: Read files
CREATE POLICY student_read_files ON storage.objects
FOR SELECT
USING (bucket_id = 'lesson-files');

-- Parents: Read files
CREATE POLICY parent_read_files ON storage.objects
FOR SELECT
USING (bucket_id = 'lesson-files');
*/

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ BEGIN RAISE NOTICE 'Migration 0004 completed successfully: Row Level Security policies created';

RAISE NOTICE 'All tables are now secured with role-based access control';

END $$;