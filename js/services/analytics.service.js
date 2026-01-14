/**
 * =====================================================
 * Analytics Service
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

class AnalyticsService {
  /**
   * Get exam statistics
   */
  async getExamStatistics(examId) {
    try {
      const { data, error } = await supabaseClient
        .from('exam_attempts')
        .select('percentage, passed, submitted_at, student_id')
        .eq('exam_id', examId)
        .not('submitted_at', 'is', null);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          highestScore: 0,
          lowestScore: 0,
          attemptsByDate: []
        };
      }

      const totalAttempts = data.length;
      const averageScore = data.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts;
      const passedCount = data.filter(a => a.passed).length;
      const passRate = (passedCount / totalAttempts) * 100;
      const highestScore = Math.max(...data.map(a => a.percentage));
      const lowestScore = Math.min(...data.map(a => a.percentage));

      // Group by date
      const attemptsByDate = this.groupByDate(data);

      return {
        totalAttempts,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        highestScore,
        lowestScore,
        attemptsByDate
      };
    } catch (error) {
      handleError(error, 'getExamStatistics');
      throw error;
    }
  }

  /**
   * Get question performance analytics
   */
  async getQuestionAnalytics(examId) {
    try {
      // This would require analyzing individual question responses
      // For now, return basic structure
      const { data: questions, error } = await supabaseClient
        .from('exam_questions')
        .select(`
          question:question_id (
            id,
            question_text,
            question_type,
            difficulty
          )
        `)
        .eq('exam_id', examId);

      if (error) throw error;

      return questions.map(q => ({
        questionId: q.question.id,
        questionText: q.question.question_text,
        questionType: q.question.question_type,
        difficulty: q.question.difficulty,
        correctRate: 0, // Would need to calculate from attempts
        avgTime: 0 // Would need time tracking
      }));
    } catch (error) {
      handleError(error, 'getQuestionAnalytics');
      throw error;
    }
  }

  /**
   * Get student performance trends
   */
  async getStudentTrends(studentId) {
    try {
      const { data, error } = await supabaseClient
        .from('exam_attempts')
        .select('percentage, passed, submitted_at')
        .eq('student_id', studentId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      return {
        scores: data.map(a => a.percentage),
        dates: data.map(a => new Date(a.submitted_at).toLocaleDateString('ar-SA')),
        passFailRecord: data.map(a => a.passed)
      };
    } catch (error) {
      handleError(error, 'getStudentTrends');
      throw error;
    }
  }

  /**
   * Get class/grade performance
   */
  async getGradePerformance(gradeLevel) {
    try {
      // Get all students in this grade
      const { data: students, error: studentsError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('grade_level', gradeLevel)
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      const studentIds = students.map(s => s.id);

      // Get all attempts for these students
      const { data: attempts, error } = await supabaseClient
        .from('exam_attempts')
        .select('percentage, passed')
        .in('student_id', studentIds)
        .not('submitted_at', 'is', null);

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        return {
          totalStudents: students.length,
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0
        };
      }

      const averageScore = attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length;
      const passedCount = attempts.filter(a => a.passed).length;
      const passRate = (passedCount / attempts.length) * 100;

      return {
        totalStudents: students.length,
        totalAttempts: attempts.length,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10
      };
    } catch (error) {
      handleError(error, 'getGradePerformance');
      throw error;
    }
  }

  /**
   * Helper: Group attempts by date
   */
  groupByDate(attempts) {
    const grouped = {};
    attempts.forEach(attempt => {
      const date = new Date(attempt.submitted_at).toLocaleDateString('ar-SA');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(attempt);
    });

    return Object.entries(grouped).map(([date, atts]) => ({
      date,
      count: atts.length,
      avgScore: atts.reduce((sum, a) => sum + a.percentage, 0) / atts.length
    }));
  }

  /**
   * Get all exams overview for analytics
   */
  async getAllExamsOverview() {
    try {
      const { data: exams, error } = await supabaseClient
        .from('exams')
        .select(`
          id,
          title,
          grade_level,
          created_at
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get attempt counts for each exam
const examsWithStats = await Promise.all(
        exams.map(async (exam) => {
          const stats = await this.getExamStatistics(exam.id);
          return {
            ...exam,
            ...stats
          };
        })
      );

      return examsWithStats;
    } catch (error) {
      handleError(error, 'getAllExamsOverview');
      throw error;
    }
  }
}

// Create global instance
window.analyticsService = new AnalyticsService();

console.log('✅ Analytics service initialized');
