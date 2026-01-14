-- =====================================================
-- Migration 0010: Homework Attempts
-- Description: Allow students to attempt/submit homeworks
-- =====================================================

CREATE TABLE homework_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homework_id UUID NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  total_points INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN, -- Optional concept for homework
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback TEXT,
  is_graded BOOLEAN DEFAULT FALSE,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE homework_attempts ENABLE ROW LEVEL SECURITY;

-- Students: Create/Update own attempts
CREATE POLICY "Students can create homework attempts" ON homework_attempts FOR
INSERT
    TO authenticated
WITH
    CHECK (student_id = auth.uid ());

CREATE POLICY "Students can update own incomplete homework attempts" ON homework_attempts FOR
UPDATE TO authenticated USING (
    student_id = auth.uid ()
    AND submitted_at IS NULL
);

CREATE POLICY "Students can view own homework attempts" ON homework_attempts FOR
SELECT TO authenticated USING (student_id = auth.uid ());

-- Admins: Full access
CREATE POLICY "Admins full access to homework attempts" ON homework_attempts FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- Trigger for auto-grading (simplified version of exam one)
CREATE OR REPLACE FUNCTION auto_grade_homework_attempt(attempt_uuid UUID)
RETURNS void AS $$
DECLARE
  attempt_record RECORD;
  question_record RECORD;
  earned_score DECIMAL := 0;
  total_pts INTEGER := 0;
  student_answer JSONB;
  percentage_score DECIMAL;
BEGIN
  SELECT * INTO attempt_record FROM homework_attempts WHERE id = attempt_uuid;
  
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO total_pts
  FROM questions
  WHERE homework_id = attempt_record.homework_id;

  -- Grade questions
  FOR question_record IN
    SELECT * FROM questions WHERE homework_id = attempt_record.homework_id
  LOOP
    student_answer := attempt_record.answers->question_record.id::text;
    
    -- Simple MCQ/TrueFalse Grading
    IF question_record.question_type IN ('mcq', 'true_false') THEN
      IF student_answer = to_jsonb(question_record.correct_answer) THEN
        earned_score := earned_score + question_record.points;
      END IF;
    END IF;
  END LOOP;

  IF total_pts > 0 THEN
    percentage_score := (earned_score / total_pts) * 100;
  ELSE
    percentage_score := 0;
  END IF;

  UPDATE homework_attempts
  SET 
    score = earned_score,
    total_points = total_pts,
    percentage = percentage_score,
    is_graded = TRUE,
    graded_at = NOW()
  WHERE id = attempt_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger wrapper
CREATE OR REPLACE FUNCTION trigger_auto_grade_homework()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.submitted_at IS NULL AND NEW.submitted_at IS NOT NULL THEN
    PERFORM auto_grade_homework_attempt(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homework_attempt_submitted
  AFTER UPDATE ON homework_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_grade_homework();