/**
 * =====================================================
 * Parent Service
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

class ParentService {
  constructor() {
    this.currentParent = null;
  }

  /**
   * Get all linked students for current parent
   */
  async getLinkedStudents() {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.profile.role !== 'parent') {
        throw new AuthError('يجب تسجيل الدخول كولي أمر');
      }

      const { data, error } = await supabaseClient
        .from('parent_student_links')
        .select(`
          id,
          status,
          approved_at,
          student:student_id (
            id,
            full_name,
            grade_level,
            avatar_url,
            created_at
          )
        `)
        .eq('parent_id', user.id)
        .eq('status', 'approved');

      if (error) throw error;

      return data.map(link => ({
        linkId: link.id,
        status: link.status,
        approvedAt: link.approved_at,
        student: link.student
      }));
    } catch (error) {
      handleError(error, 'getLinkedStudents');
      throw error;
    }
  }

  /**
   * Request link with student by email
   */
  async requestStudentLink(studentEmail) {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.profile.role !== 'parent') {
        throw new AuthError('يجب تسجيل الدخول كولي أمر');
      }

      console.log('🔍 Searching for student with email:', studentEmail);

      // First, let's check all profiles with their emails (for debugging)
      const { data: allProfiles, error: debugError } = await supabaseClient
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('role', 'student')
        .limit(10);

      if (!debugError) {
        console.log('📋 Available student profiles:', allProfiles);
        console.log('📧 Student emails in database:', allProfiles.map(p => p.email));
      }

      // Find student by email (case-insensitive)
      const { data: students, error: studentError } = await supabaseClient
        .from('profiles')
        .select('id, role, full_name, email')
        .ilike('email', studentEmail)
        .eq('role', 'student');

      console.log('🔎 Query result:', { students, error: studentError });

      if (studentError) {
        console.error('❌ Database error:', studentError);
        throw studentError;
      }

      if (!students || students.length === 0) {
        // Try exact match as fallback
        const { data: exactMatch } = await supabaseClient
          .from('profiles')
          .select('id, role, full_name, email')
          .eq('email', studentEmail.trim())
          .eq('role', 'student')
          .maybeSingle();

        if (!exactMatch) {
          console.error('❌ No student found with email:', studentEmail);
          throw new NotFoundError('لم يتم العثور على طالب بهذا البريد الإلكتروني');
        }
        
        students[0] = exactMatch;
      }

      const student = students[0];
      console.log('✅ Found student:', student);

      // Check if link already exists
      const { data: existingLink } = await supabaseClient
        .from('parent_student_links')
        .select('id, status')
        .eq('parent_id', user.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (existingLink) {
        throw new ValidationError('الربط موجود بالفعل');
      }

      // Create link with auto-approval
      const { data, error } = await supabaseClient
        .from('parent_student_links')
        .insert({
          parent_id: user.id,
          student_id: student.id,
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      showSuccess(`تم الربط بنجاح مع الطالب ${student.full_name}`);
      return data;
    } catch (error) {
      handleError(error, 'requestStudentLink');
      throw error;
    }
  }

/**
   * Get all exams for a specific student
   */
  async getStudentExams(studentId) {
    try {
      await this.verifyStudentAccess(studentId);

      const { data, error } = await supabaseClient
        .from('exam_attempts')
        .select(`
          id,
          started_at,
          submitted_at,
          score,
          total_points,
          percentage,
          passed,
          exam:exam_id (
            id,
            title,
            description,
            subject_id,
            grade_level
          )
        `)
        .eq('student_id', studentId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      handleError(error, 'getStudentExams');
      throw error;
    }
  }

  /**
   * Get detailed exam attempt result
   */
  async getAttemptDetails(attemptId, studentId) {
    try {
      await this.verifyStudentAccess(studentId);

      const { data, error } = await supabaseClient
        .from('exam_attempts')
        .select(`
          *,
          exam:exam_id (
            id,
            title,
            description,
            subject_id,
            grade_level,
            duration_minutes,
            passing_score
          )
        `)
        .eq('id', attemptId)
        .eq('student_id', studentId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      handleError(error, 'getAttemptDetails');
      throw error;
    }
  }

  /**
   * Get performance analytics for student
   */
  async getStudentPerformance(studentId) {
    try {
      await this.verifyStudentAccess(studentId);

      const { data: attempts, error } = await supabaseClient
        .from('exam_attempts')
        .select('percentage, passed, submitted_at')
        .eq('student_id', studentId)
        .not('submitted_at', 'is', null);

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        return {
          totalExams: 0,
          averageScore: 0,
          passRate: 0,
          recentTrend: 'N/A'
        };
      }

      const totalExams = attempts.length;
      const averageScore = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalExams;
      const passedCount = attempts.filter(a => a.passed).length;
      const passRate = (passedCount / totalExams) * 100;

      // Calculate recent trend (last 5 vs previous)
      let recentTrend = 'stable';
      if (totalExams >= 6) {
        const recent5 = attempts.slice(0, 5);
        const previous5 = attempts.slice(5, 10);
        const recentAvg = recent5.reduce((sum, a) => sum + (a.percentage || 0), 0) / 5;
        const previousAvg = previous5.reduce((sum, a) => sum + (a.percentage || 0), 0) / Math.min(5, previous5.length);
        
        if (recentAvg > previousAvg + 5) recentTrend = 'improving';
        else if (recentAvg < previousAvg - 5) recentTrend = 'declining';
      }

      return {
        totalExams,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        recentTrend
      };
    } catch (error) {
      handleError(error, 'getStudentPerformance');
      throw error;
    }
  }

  /**
   * Verify parent has access to student
   */
  async verifyStudentAccess(studentId) {
    const user = await authService.getCurrentUser();
    if (!user || user.profile.role !== 'parent') {
      throw new AuthError('يجب تسجيل الدخول كولي أمر');
    }

    const { data, error } = await supabaseClient
      .from('parent_student_links')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new AuthError('غير مصرح لك بالوصول إلى بيانات هذا الطالب');
    }

    return true;
  }

  /**
   * Remove student link
   */
  async removeStudentLink(linkId) {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.profile.role !== 'parent') {
        throw new AuthError('يجب تسجيل الدخول كولي أمر');
      }

      const confirmed = await showConfirm({
        title: 'إزالة الربط',
        message: 'هل أنت متأكد من إزالة الربط مع هذا الطالب؟',
        confirmText: 'إزالة',
        confirmClass: 'btn-error'
      });

      if (!confirmed) return false;

      const { error } = await supabaseClient
        .from('parent_student_links')
        .delete()
        .eq('id', linkId)
        .eq('parent_id', user.id);

      if (error) throw error;

      showSuccess('تم إزالة الربط بنجاح');
      return true;
    } catch (error) {
      handleError(error, 'removeStudentLink');
      throw error;
    }
  }
}

// Create global instance
window.parentService = new ParentService();

console.log('✅ Parent service initialized');
