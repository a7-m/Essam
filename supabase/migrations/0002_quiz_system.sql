-- =====================================================
-- Migration 0002: Quiz System Tables
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Question bank, exams, and exam attempts
-- =====================================================

-- =====================================================
-- QUESTION BANK TABLE
-- =====================================================
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'essay')),
  question_text TEXT NOT NULL,
  options JSONB, -- For MCQ and True/False questions
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1 CHECK (points > 0),
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON
TABLE question_bank IS 'Central question bank for all exams';

COMMENT ON COLUMN question_bank.question_type IS 'Question type: mcq, true_false, or essay';

COMMENT ON COLUMN question_bank.options IS 'JSON array of answer options for MCQ/True-False';

COMMENT ON COLUMN question_bank.correct_answer IS 'Correct answer (exact match for auto-grading)';

-- =====================================================
-- EXAMS TABLE
-- =====================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 5 AND 12),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    max_attempts INTEGER DEFAULT 1 CHECK (max_attempts > 0),
    shuffle_questions BOOLEAN DEFAULT TRUE,
    shuffle_options BOOLEAN DEFAULT TRUE,
    show_results BOOLEAN DEFAULT TRUE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    passing_score INTEGER DEFAULT 50 CHECK (
        passing_score BETWEEN 0 AND 100
    ),
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles (id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    CHECK (
        ends_at IS NULL
        OR starts_at IS NULL
        OR ends_at > starts_at
    )
);

COMMENT ON TABLE exams IS 'Exams configuration and settings';

-- =====================================================
-- EXAM QUESTIONS TABLE (Junction)
-- =====================================================
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    exam_id UUID NOT NULL REFERENCES exams (id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES question_bank (id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    points_override INTEGER CHECK (
        points_override IS NULL
        OR points_override > 0
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (exam_id, question_id)
);

COMMENT ON
TABLE exam_questions IS 'Questions assigned to specific exams';

COMMENT ON COLUMN exam_questions.points_override IS 'Override default question points for this exam';

-- =====================================================
-- EXAM ATTEMPTS TABLE
-- =====================================================
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  total_points INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  tab_switches INTEGER DEFAULT 0,
  is_graded BOOLEAN DEFAULT FALSE,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id),
  feedback TEXT,
  time_spent_seconds INTEGER
);

-- =====================================================
-- FUNCTION & TRIGGER: Validate Student Role
-- =====================================================
CREATE OR REPLACE FUNCTION validate_student_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.student_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'المستخدم يجب أن يكون طالباً لإجراء الاختبار';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_student_role
  BEFORE INSERT ON exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION validate_student_role();

COMMENT ON
TABLE exam_attempts IS 'Student exam attempts and results';

COMMENT ON COLUMN exam_attempts.answers IS 'JSON object with question_id as key and student answer as value';

COMMENT ON COLUMN exam_attempts.tab_switches IS 'Anti-cheating: number of times student switched tabs';

-- =====================================================
-- FUNCTION: Calculate Total Exam Points
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_exam_total_points(exam_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    COALESCE(eq.points_override, qb.points)
  ), 0) INTO total
  FROM exam_questions eq
  JOIN question_bank qb ON eq.question_id = qb.id
  WHERE eq.exam_id = exam_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Auto-Grade Exam Attempt
-- =====================================================
CREATE OR REPLACE FUNCTION auto_grade_attempt(attempt_uuid UUID)
RETURNS void AS $$
DECLARE
  attempt_record RECORD;
  question_record RECORD;
  earned_score DECIMAL := 0;
  total_pts INTEGER := 0;
  percentage_score DECIMAL;
  is_passing BOOLEAN;
BEGIN
  -- Get attempt details
  SELECT * INTO attempt_record
  FROM exam_attempts
  WHERE id = attempt_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  
  -- Calculate total points
  total_pts := calculate_exam_total_points(attempt_record.exam_id);
  
  -- Grade each question
  FOR question_record IN
    SELECT 
      eq.question_id,
      qb.question_type,
      qb.correct_answer,
      COALESCE(eq.points_override, qb.points) as points
    FROM exam_questions eq
    JOIN question_bank qb ON eq.question_id = qb.id
    WHERE eq.exam_id = attempt_record.exam_id
  LOOP
    -- Auto-grade MCQ and True/False only
    IF question_record.question_type IN ('mcq', 'true_false') THEN
      IF attempt_record.answers->question_record.question_id::text = to_jsonb(question_record.correct_answer) THEN
        earned_score := earned_score + question_record.points;
      END IF;
    END IF;
    -- Essay questions require manual grading
  END LOOP;
  
  -- Calculate percentage
  IF total_pts > 0 THEN
    percentage_score := (earned_score / total_pts) * 100;
  ELSE
    percentage_score := 0;
  END IF;
  
  -- Determine if passed
  SELECT passing_score INTO is_passing
  FROM exams
  WHERE id = attempt_record.exam_id;
  
  is_passing := percentage_score >= is_passing;
  
  -- Update attempt
  UPDATE exam_attempts
  SET 
    score = earned_score,
    total_points = total_pts,
    percentage = percentage_score,
    passed = is_passing,
    is_graded = TRUE,
    graded_at = NOW()
  WHERE id = attempt_uuid;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Auto-grade on submission
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_auto_grade()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-grade when submitted_at changes from NULL
  IF OLD.submitted_at IS NULL AND NEW.submitted_at IS NOT NULL THEN
    PERFORM auto_grade_attempt(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_attempt_submitted
  AFTER UPDATE ON exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_grade();

-- =====================================================
-- AUTO-UPDATE TRIGGERS
-- =====================================================
CREATE TRIGGER update_question_bank_updated_at
  BEFORE UPDATE ON question_bank
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 0002 completed successfully: Quiz system tables created';
END $$;