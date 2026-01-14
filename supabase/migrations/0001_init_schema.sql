-- =====================================================
-- Migration 0001: Initial Database Schema
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Core tables for users, subjects, lessons, and files
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('admin', 'student', 'parent')
    ),
    grade_level INTEGER CHECK (
        grade_level IS NULL
        OR (grade_level BETWEEN 5 AND 12)
    ),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE profiles IS 'User profiles with role-based access';

COMMENT ON COLUMN profiles.role IS 'User role: admin, student, or parent';

COMMENT ON COLUMN profiles.grade_level IS 'Student grade level (5-12), NULL for admin and parent';

-- =====================================================
-- PARENT-STUDENT LINKS TABLE
-- =====================================================
CREATE TABLE parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    parent_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'rejected'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    UNIQUE (parent_id, student_id)
);

COMMENT ON
TABLE parent_student_links IS 'Links between parents and students';

-- =====================================================
-- SUBJECTS TABLE
-- =====================================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    description TEXT,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 5 AND 12),
    icon TEXT,
    color TEXT,
    created_by UUID REFERENCES profiles (id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON
TABLE subjects IS 'Academic subjects organized by grade level';

-- =====================================================
-- UNITS TABLE
-- =====================================================
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    subject_id UUID NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE units IS 'Study units within subjects';

-- =====================================================
-- LESSONS TABLE
-- =====================================================
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    unit_id UUID NOT NULL REFERENCES units (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE lessons IS 'Individual lessons within units';

-- =====================================================
-- FILES TABLE
-- =====================================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (
        file_type IN (
            'pdf',
            'image',
            'video',
            'youtube'
        )
    ),
    file_url TEXT NOT NULL,
    file_size BIGINT,
    thumbnail_url TEXT,
    uploaded_by UUID REFERENCES profiles (id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE files IS 'Files and media attached to lessons';

COMMENT ON COLUMN files.file_type IS 'File type: pdf, image, video, or youtube';

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 0001 completed successfully: Core tables created';
END $$;