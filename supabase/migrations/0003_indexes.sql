-- =====================================================
-- Migration 0003: Performance Indexes
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Optimize query performance with strategic indexes
-- =====================================================

-- =====================================================
-- PROFILES INDEXES
-- =====================================================
CREATE INDEX idx_profiles_role ON profiles (role);

CREATE INDEX idx_profiles_grade_level ON profiles (grade_level)
WHERE
    grade_level IS NOT NULL;

CREATE INDEX idx_profiles_created_at ON profiles (created_at DESC);

-- =====================================================
-- PARENT-STUDENT LINKS INDEXES
-- =====================================================
CREATE INDEX idx_parent_links_parent ON parent_student_links (parent_id);

CREATE INDEX idx_parent_links_student ON parent_student_links (student_id);

CREATE INDEX idx_parent_links_status ON parent_student_links (status);

-- =====================================================
-- SUBJECTS INDEXES
-- =====================================================
CREATE INDEX idx_subjects_grade_level ON subjects (grade_level);

CREATE INDEX idx_subjects_created_by ON subjects (created_by);

-- =====================================================
-- UNITS INDEXES
-- =====================================================
CREATE INDEX idx_units_subject_id ON units (subject_id);

CREATE INDEX idx_units_subject_order ON units (subject_id, order_index);

-- =====================================================
-- LESSONS INDEXES
-- =====================================================
CREATE INDEX idx_lessons_unit_id ON lessons (unit_id);

CREATE INDEX idx_lessons_unit_order ON lessons (unit_id, order_index);

CREATE INDEX idx_lessons_published ON lessons (is_published)
WHERE
    is_published = TRUE;

-- =====================================================
-- FILES INDEXES
-- =====================================================
CREATE INDEX idx_files_lesson_id ON files (lesson_id);

CREATE INDEX idx_files_type ON files (file_type);

CREATE INDEX idx_files_uploaded_by ON files (uploaded_by);

-- =====================================================
-- QUESTION BANK INDEXES
-- =====================================================
CREATE INDEX idx_questions_subject_id ON question_bank (subject_id);

CREATE INDEX idx_questions_unit_id ON question_bank (unit_id)
WHERE
    unit_id IS NOT NULL;

CREATE INDEX idx_questions_type ON question_bank (question_type);

CREATE INDEX idx_questions_difficulty ON question_bank (difficulty)
WHERE
    difficulty IS NOT NULL;

CREATE INDEX idx_questions_created_by ON question_bank (created_by);

CREATE INDEX idx_questions_tags ON question_bank USING GIN (tags);

-- =====================================================
-- EXAMS INDEXES
-- =====================================================
CREATE INDEX idx_exams_subject_id ON exams (subject_id);

CREATE INDEX idx_exams_grade_level ON exams (grade_level);

CREATE INDEX idx_exams_published ON exams (is_published)
WHERE
    is_published = TRUE;

CREATE INDEX idx_exams_created_by ON exams (created_by);

CREATE INDEX idx_exams_dates ON exams (starts_at, ends_at);

-- =====================================================
-- EXAM QUESTIONS INDEXES
-- =====================================================
CREATE INDEX idx_exam_questions_exam_id ON exam_questions (exam_id);

CREATE INDEX idx_exam_questions_question_id ON exam_questions (question_id);

CREATE INDEX idx_exam_questions_order ON exam_questions (exam_id, order_index);

-- =====================================================
-- EXAM ATTEMPTS INDEXES
-- =====================================================
CREATE INDEX idx_attempts_exam_id ON exam_attempts (exam_id);

CREATE INDEX idx_attempts_student_id ON exam_attempts (student_id);

CREATE INDEX idx_attempts_submitted ON exam_attempts (submitted_at DESC)
WHERE
    submitted_at IS NOT NULL;

CREATE INDEX idx_attempts_graded ON exam_attempts (is_graded)
WHERE
    is_graded = FALSE;

CREATE INDEX idx_attempts_student_exam ON exam_attempts (student_id, exam_id);

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================
-- Get student's exam history with scores
CREATE INDEX idx_attempts_student_score ON exam_attempts (
    student_id,
    exam_id,
    percentage DESC
)
WHERE
    submitted_at IS NOT NULL;

-- Get exam results for grading
CREATE INDEX idx_attempts_grading_queue ON exam_attempts (exam_id, submitted_at)
WHERE
    is_graded = FALSE;

-- =====================================================
-- ANALYZE TABLES
-- =====================================================
ANALYZE profiles;

ANALYZE parent_student_links;

ANALYZE subjects;

ANALYZE units;

ANALYZE lessons;

ANALYZE files;

ANALYZE question_bank;

ANALYZE exams;

ANALYZE exam_questions;

ANALYZE exam_attempts;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ BEGIN RAISE NOTICE 'Migration 0003 completed successfully: Performance indexes created';

END $$;