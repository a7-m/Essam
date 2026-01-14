-- =====================================================
-- Migration 0005: Quiz Engine Enhancements
-- Platform: منصة الأستاذ عصام عبدالمنعم التعليمية
-- Description: Enhanced question types and features
-- =====================================================

-- Add new columns to question_bank
ALTER TABLE question_bank 
ADD COLUMN IF NOT EXISTS question_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS hint TEXT,
ADD COLUMN IF NOT EXISTS allow_partial_credit BOOLEAN DEFAULT FALSE;

-- Update question_type constraint to include new types
ALTER TABLE question_bank
DROP CONSTRAINT IF EXISTS question_bank_question_type_check;

ALTER TABLE question_bank
ADD CONSTRAINT question_bank_question_type_check CHECK (
    question_type IN (
        'mcq', -- Multiple choice
        'true_false', -- True/False
        'essay', -- Essay question
        'ordering', -- Ordering/sequencing items
        'matching', -- Match pairs
        'fill_blank', -- Fill in the blanks
        'drag_drop' -- Drag and drop
    )
);

-- Add comments
COMMENT ON COLUMN question_bank.question_data IS 'JSONB data for complex question structures (ordering items, matching pairs, etc.)';

COMMENT ON COLUMN question_bank.media_url IS 'URL for question image or media file';

COMMENT ON COLUMN question_bank.hint IS 'Optional hint text for students';

COMMENT ON COLUMN question_bank.allow_partial_credit IS 'Whether partial credit is allowed for this question';

-- =====================================================
-- UPDATED AUTO-GRADING FUNCTION
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
  student_answer JSONB;
  is_correct BOOLEAN;
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
      qb.question_data,
      qb.allow_partial_credit,
      COALESCE(eq.points_override, qb.points) as points
    FROM exam_questions eq
    JOIN question_bank qb ON eq.question_id = qb.id
    WHERE eq.exam_id = attempt_record.exam_id
  LOOP
    -- Get student answer
    student_answer := attempt_record.answers->question_record.question_id::text;
    is_correct := FALSE;
    
    -- Auto-grade based on question type
    IF question_record.question_type IN ('mcq', 'true_false') THEN
      -- Simple answer comparison
      IF student_answer = to_jsonb(question_record.correct_answer) THEN
        is_correct := TRUE;
      END IF;
      
    ELSIF question_record.question_type = 'ordering' THEN
      -- Check if order matches exactly
      IF student_answer = question_record.question_data->'correct_order' THEN
        is_correct := TRUE;
      ELSIF question_record.allow_partial_credit THEN
        -- Calculate partial credit based on correctly positioned items
        -- (simplified version - could be enhanced)
        DECLARE
          correct_order JSONB := question_record.question_data->'correct_order';
          matches INTEGER := 0;
          total_items INTEGER := jsonb_array_length(correct_order);
        BEGIN
          FOR i IN 0..total_items-1 LOOP
            IF student_answer->i = correct_order->i THEN
              matches := matches + 1;
            END IF;
          END LOOP;
          earned_score := earned_score + (question_record.points * matches / total_items);
          CONTINUE;
        EXCEPTION WHEN OTHERS THEN
          -- If error, no partial credit
          NULL;
        END;
      END IF;
      
    ELSIF question_record.question_type = 'matching' THEN
      -- Check if all pairs match correctly
      IF student_answer = question_record.question_data->'correct_pairs' THEN
        is_correct := TRUE;
      ELSIF question_record.allow_partial_credit THEN
        -- Calculate partial credit based on correct pairs
        DECLARE
          correct_pairs JSONB := question_record.question_data->'correct_pairs';
          matches INTEGER := 0;
          total_pairs INTEGER := jsonb_object_keys(correct_pairs)::INTEGER;
          key TEXT;
        BEGIN
          FOR key IN SELECT jsonb_object_keys(correct_pairs) LOOP
            IF student_answer->key = correct_pairs->key THEN
              matches := matches + 1;
            END IF;
          END LOOP;
          earned_score := earned_score + (question_record.points * matches / total_pairs);
          CONTINUE;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
      
    ELSIF question_record.question_type = 'fill_blank' THEN
      -- Check if all blanks filled correctly (case-insensitive)
      IF student_answer = question_record.question_data->'correct_answers' THEN
        is_correct := TRUE;
      ELSIF question_record.allow_partial_credit THEN
        -- Partial credit for each correct blank
        DECLARE
          correct_answers JSONB := question_record.question_data->'correct_answers';
          matches INTEGER := 0;
          total_blanks INTEGER := jsonb_array_length(correct_answers);
        BEGIN
          FOR i IN 0..total_blanks-1 LOOP
            IF LOWER(student_answer->>i) = LOWER(correct_answers->>i) THEN
              matches := matches + 1;
            END IF;
          END LOOP;
          earned_score := earned_score + (question_record.points * matches / total_blanks);
          CONTINUE;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
      
    ELSIF question_record.question_type = 'drag_drop' THEN
      -- Check if items placed in correct zones
      IF student_answer = question_record.question_data->'correct_placements' THEN
        is_correct := TRUE;
      ELSIF question_record.allow_partial_credit THEN
        -- Partial credit for correctly placed items
        DECLARE
          correct_placements JSONB := question_record.question_data->'correct_placements';
          matches INTEGER := 0;
          total_items INTEGER;
          key TEXT;
        BEGIN
          total_items := (SELECT COUNT(*) FROM jsonb_object_keys(correct_placements));
          FOR key IN SELECT jsonb_object_keys(correct_placements) LOOP
            IF student_answer->key = correct_placements->key THEN
              matches := matches + 1;
            END IF;
          END LOOP;
          earned_score := earned_score + (question_record.points * matches / total_items);
          CONTINUE;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
      
    -- Essay questions require manual grading
    ELSIF question_record.question_type = 'essay' THEN
      CONTINUE;
    END IF;
    
    -- Add points if correct
    IF is_correct THEN
      earned_score := earned_score + question_record.points;
    END IF;
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
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 0005 completed successfully: Quiz engine enhancements applied';
END $$;