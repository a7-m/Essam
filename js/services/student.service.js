/**
 * =====================================================
 * Student Service
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

class StudentService {
  /**
   * SUBJECTS & CONTENT
   */
  async getMySubjects() {
    try {
      const user = await window.authService.getCurrentUser();
      if (!user || user.profile.role !== 'student') throw new AuthError('يجب أن تكون طالباً للوصول لهذه البيانات');

      const { data, error } = await supabaseClient
        .from('subjects')
        .select('*')
        .eq('grade_level', user.profile.grade_level)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'getMySubjects');
      throw error;
    }
  }

  async getUnits(subjectId) {
    const { data, error } = await supabaseClient
      .from('units')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async getLessons(unitId) {
    const { data, error } = await supabaseClient
      .from('lessons')
      .select('*')
      .eq('unit_id', unitId)
      .eq('is_published', true)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async getLessonDetails(lessonId) {
    const { data, error } = await supabaseClient
      .from('lessons')
      .select('*, units(subject_id, subjects(name))')
      .eq('id', lessonId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getLessonFiles(lessonId) {
    const { data, error } = await supabaseClient
      .from('files')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  /**
   * EXAMS & RESULTS
   */
  async getAvailableExams() {
    try {
      const user = await window.authService.getCurrentUser();
      if (!user) return [];

      // Get exams for student's grade
      const { data: exams, error: examsError } = await supabaseClient
        .from('exams')
        .select('*, subjects(name)')
        .eq('grade_level', user.profile.grade_level)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (examsError) throw examsError;

      // Get student's attempts for these exams
      const { data: attempts, error: attemptsError } = await supabaseClient
        .from('exam_attempts')
        .select('exam_id, submitted_at, passed, score, total_points')
        .eq('student_id', user.id);

      if (attemptsError) throw attemptsError;

      // Map attempts to exams
      return exams.map(exam => {
        const examAttempts = attempts.filter(a => a.exam_id === exam.id);
        return {
          ...exam,
          attempts_count: examAttempts.length,
          last_score: examAttempts.length > 0 ? examAttempts[examAttempts.length - 1].score : null,
          is_completed: examAttempts.some(a => a.submitted_at !== null),
          can_attempt: examAttempts.length < exam.max_attempts
        };
      });
    } catch (error) {
      handleError(error, 'getAvailableExams');
      throw error;
    }
  }

  async getExamMetadata(examId) {
    const { data, error } = await supabaseClient
      .from('exams')
      .select('*, subjects(name)')
      .eq('id', examId)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * QUIZ ENGINE OPERATIONS
   */
  async startExam(examId) {
    try {
      const user = await window.authService.getCurrentUser();
      
      // Create new attempt
      const { data, error } = await supabaseClient
        .from('exam_attempts')
        .insert([{
          exam_id: examId,
          student_id: user.id,
          started_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;

      // Fetch exam questions (without answers) from unified 'questions' table
      const { data: questions, error: qError } = await supabaseClient
        .from('questions')
        .select('id, question_text, question_type, options, points, question_data, media_url, hint')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (qError) throw qError;

      return {
        attempt: data,
        questions: questions.map(q => ({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          options: q.options,
          points: q.points,
          data: q.question_data,
          media: q.media_url,
          hint: q.hint
        }))
      };
    } catch (error) {
      handleError(error, 'startExam');
      throw error;
    }
  }

  async submitExam(attemptId, answers, tabSwitches = 0) {
    try {
      const { data, error } = await supabaseClient
        .from('exam_attempts')
        .update({
          answers: answers,
          submitted_at: new Date().toISOString(),
          tab_switches: tabSwitches
        })
        .eq('id', attemptId)
        .select()
        .single();
      
      if (error) throw error;
      
      // The auto-grading trigger in Supabase will handle the rest
      return data;
    } catch (error) {
      handleError(error, 'submitExam');
      throw error;
    }
  }

  async getAttemptResult(attemptId) {
    const { data, error } = await supabaseClient
      .from('exam_attempts')
      .select('*, exams(title, show_correct_answers)')
      .eq('id', attemptId)
      .single();
    
    if (error) throw error;
    return data;
  }
  /**
   * HOMEWORKS (New Section)
   */
  async getAvailableHomeworks() {
    try {
      const user = await window.authService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabaseClient
        .from('homeworks')
        .select('*, subjects(name)')
        .eq('grade_level', user.profile.grade_level)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'getAvailableHomeworks');
      return [];
    }
  }

  async startHomework(homeworkId) {
    try {
      const user = await window.authService.getCurrentUser();
      
      const { data, error } = await supabaseClient
        .from('homework_attempts')
        .insert([{
          homework_id: homeworkId,
          student_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;

      const { data: questions, error: qError } = await supabaseClient
        .from('questions')
        .select('id, question_text, question_type, options, points, question_data, media_url, hint')
        .eq('homework_id', homeworkId)
        .order('order_index', { ascending: true });

      if (qError) throw qError;

      return {
        attempt: data,
        questions: questions.map(q => ({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          options: q.options,
          points: q.points,
          data: q.question_data,
          media: q.media_url,
          hint: q.hint
        }))
      };
    } catch (error) {
      handleError(error, 'startHomework');
      throw error;
    }
  }

  async submitHomework(attemptId, answers) {
    try {
      const { data, error } = await supabaseClient
        .from('homework_attempts')
        .update({
          answers: answers,
          submitted_at: new Date().toISOString()
        })
        .eq('id', attemptId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'submitHomework');
      throw error;
    }
  }
}

// Create global instance
window.studentService = new StudentService();
console.log('✅ Student service initialized');
