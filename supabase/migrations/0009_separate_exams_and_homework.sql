-- =====================================================
-- Migration 0009: Separate Exams and Homework (De-couple Question Bank)
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description:
-- 1. Ensure required columns exist in question_bank (self-healing for skipped migrations).
-- 2. Create 'homeworks' table.
-- 3. Create unified 'questions' table.
-- 4. Migrate data from 'question_bank' and 'exam_questions'.
-- 5. Drop 'question_bank' and 'exam_questions'.
-- =====================================================

-- =====================================================
-- 0. Self-Healing (Ensure columns from 0005 exist)
-- =====================================================
ALTER TABLE IF EXISTS question_bank 
ADD COLUMN IF NOT EXISTS question_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS hint TEXT,
ADD COLUMN IF NOT EXISTS allow_partial_credit BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 1. Create HOMEWORKS Table
-- =====================================================
CREATE TABLE IF NOT EXISTS homeworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units (id) ON DELETE SET NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 5 AND 12),
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles (id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON
TABLE homeworks IS 'Homework assignments replacing the old question bank organization';

-- =====================================================
-- 2. Create Unified QUESTIONS Table
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    homework_id UUID REFERENCES homeworks(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (
        question_type IN (
            'mcq', 'true_false', 'essay', 
            'ordering', 'matching', 'fill_blank', 'drag_drop'
        )
    ),
    options JSONB,
    correct_answer TEXT,
    question_data JSONB DEFAULT '{}'::jsonb,
    points INTEGER DEFAULT 1 CHECK (points > 0),
    explanation TEXT,
    hint TEXT,
    media_url TEXT,
    allow_partial_credit BOOLEAN DEFAULT FALSE,
    difficulty TEXT CHECK (
        difficulty IN ('easy', 'medium', 'hard')
    ),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT questions_owner_check CHECK (
        (exam_id IS NOT NULL AND homework_id IS NULL) OR 
        (exam_id IS NULL AND homework_id IS NOT NULL)
    )
);

COMMENT ON
TABLE questions IS 'Unified questions table for both Exams and Homeworks';

-- =====================================================
-- 3. Data Migration
-- =====================================================

-- A. Migrate "Exam Questions"
INSERT INTO
    questions (
        id,
        exam_id,
        question_text,
        question_type,
        options,
        correct_answer,
        question_data,
        points,
        explanation,
        hint,
        media_url,
        allow_partial_credit,
        difficulty,
        order_index,
        created_at,
        updated_at
    )
SELECT
    uuid_generate_v4 (),
    eq.exam_id,
    qb.question_text,
    qb.question_type,
    qb.options,
    qb.correct_answer,
    qb.question_data,
    COALESCE(eq.points_override, qb.points),
    qb.explanation,
    qb.hint,
    qb.media_url,
    qb.allow_partial_credit,
    qb.difficulty,
    eq.order_index,
    qb.created_at,
    qb.updated_at
FROM
    exam_questions eq
    JOIN question_bank qb ON eq.question_id = qb.id;

-- B. Migrate "Unused Questions" into Legacy Homeworks
DO $$
DECLARE
    subject_rec RECORD;
    homework_uuid UUID;
BEGIN
    FOR subject_rec IN SELECT * FROM subjects LOOP
        INSERT INTO homeworks (title, description, subject_id, grade_level, is_published, created_by)
        VALUES (
            'أسئلة بنك الأسئلة (أرشيف)', 
            'تم استيراد هذه الأسئلة تلقائياً من بنك الأسئلة القديم.',
            subject_rec.id,
            subject_rec.grade_level,
            FALSE,
            NULL
        ) RETURNING id INTO homework_uuid;

        INSERT INTO questions (
            homework_id, question_text, question_type, options, correct_answer, 
            question_data, points, explanation, hint, media_url, allow_partial_credit, difficulty, 
            order_index, created_at, updated_at
        )
        SELECT 
            homework_uuid,
            question_text,
            question_type,
            options,
            correct_answer,
            question_data,
            points,
            explanation,
            hint,
            media_url,
            allow_partial_credit,
            difficulty,
            0,
            created_at,
            updated_at
        FROM question_bank
        WHERE subject_id = subject_rec.id;
    END LOOP;
END $$;

-- =====================================================
-- 4. Clean Up
-- =====================================================
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS question_bank;

-- =====================================================
-- 5. RLS Policies
-- =====================================================
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on homeworks" ON homeworks;
CREATE POLICY "Admins can do everything on homeworks" ON homeworks FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid () AND role = 'admin')
);

DROP POLICY IF EXISTS "Students can view published homeworks" ON homeworks;
CREATE POLICY "Students can view published homeworks" ON homeworks FOR SELECT TO authenticated USING (is_published = true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on questions" ON questions;
CREATE POLICY "Admins can do everything on questions" ON questions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid () AND role = 'admin')
);

DROP POLICY IF EXISTS "Students can view exam questions" ON questions;
CREATE POLICY "Students can view exam questions" ON questions FOR SELECT TO authenticated USING (
    (exam_id IS NOT NULL AND EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND is_published = true))
    OR (homework_id IS NOT NULL AND EXISTS (SELECT 1 FROM homeworks WHERE id = homework_id AND is_published = true))
);

-- =====================================================
-- 6. Update Triggers
-- =====================================================
DROP TRIGGER IF EXISTS update_homeworks_updated_at ON homeworks;
CREATE TRIGGER update_homeworks_updated_at
  BEFORE UPDATE ON homeworks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 7. Fix Functions
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_exam_total_points(exam_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total
  FROM questions
  WHERE exam_id = exam_uuid;
  RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_grade_attempt(attempt_uuid UUID)
RETURNS void AS $$
DECLARE
  attempt_record RECORD;
  question_record RECORD;
  earned_score DECIMAL := 0;
  total_pts INTEGER := 0;
  percentage_score DECIMAL;
  is_passing BOOLEAN;
  passing_threshold INTEGER;
  student_answer JSONB;
BEGIN
  SELECT * INTO attempt_record FROM exam_attempts WHERE id = attempt_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  
  total_pts := calculate_exam_total_points(attempt_record.exam_id);
  
  FOR question_record IN
    SELECT id as question_id, question_type, correct_answer, question_data, allow_partial_credit, points
    FROM questions WHERE exam_id = attempt_record.exam_id
  LOOP
    student_answer := attempt_record.answers->question_record.question_id::text;
    IF question_record.question_type IN ('mcq', 'true_false') THEN
      IF student_answer = to_jsonb(question_record.correct_answer) THEN
        earned_score := earned_score + question_record.points;
      END IF;
    END IF;
  END LOOP;
  
  IF total_pts > 0 THEN percentage_score := (earned_score / total_pts) * 100; ELSE percentage_score := 0; END IF;
  
  SELECT passing_score INTO passing_threshold FROM exams WHERE id = attempt_record.exam_id;
  is_passing := percentage_score >= passing_threshold;
  
  UPDATE exam_attempts SET 
    score = earned_score, total_points = total_pts, percentage = percentage_score,
    passed = is_passing, is_graded = TRUE, graded_at = NOW()
  WHERE id = attempt_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;