/**
 * =====================================================
 * Admin Service
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

class AdminService {
  /**
   * SUBJECTS MANAGEMENT
   */
  async getSubjects(gradeLevel = null) {
    let query = supabaseClient.from('subjects').select('*').order('created_at', { ascending: false });
    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async addSubject(subjectData) {
    const { data, error } = await supabaseClient
      .from('subjects')
      .insert([subjectData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateSubject(id, updates) {
    const { data, error } = await supabaseClient
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSubject(id) {
    const { error } = await supabaseClient.from('subjects').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * UNITS MANAGEMENT
   */
  async getUnits(subjectId) {
    const { data, error } = await supabaseClient
      .from('units')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  }

  async addUnit(unitData) {
    const { data, error } = await supabaseClient
      .from('units')
      .insert([unitData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateUnit(id, updates) {
    const { data, error } = await supabaseClient
      .from('units')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteUnit(id) {
    const { error } = await supabaseClient.from('units').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * LESSONS MANAGEMENT
   */
  async getLessons(unitId) {
    const { data, error } = await supabaseClient
      .from('lessons')
      .select('*')
      .eq('unit_id', unitId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  }

  async addLesson(lessonData) {
    const { data, error } = await supabaseClient
      .from('lessons')
      .insert([lessonData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateLesson(id, updates) {
    const { data, error } = await supabaseClient
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteLesson(id) {
    const { error } = await supabaseClient.from('lessons').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * FILES MANAGEMENT
   */
  async getFiles(lessonId) {
    const { data, error } = await supabaseClient
      .from('files')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async uploadFile(lessonId, file, type) {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `lessons/${lessonId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from(window.APP_CONFIG.storageBucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from(window.APP_CONFIG.storageBucket)
        .getPublicUrl(filePath);

      const { data: fileRecord, error: dbError } = await supabaseClient
        .from('files')
        .insert([{
          lesson_id: lessonId,
          file_name: file.name,
          file_type: type,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by: (await window.authService.getCurrentUser()).id
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      return fileRecord;
    } catch (error) {
      handleError(error, 'uploadFile');
      throw error;
    }
  }

  async addYoutubeLink(lessonId, title, url) {
    const { data, error } = await supabaseClient
      .from('files')
      .insert([{
        lesson_id: lessonId,
        file_name: title,
        file_type: 'youtube',
        file_url: url,
        uploaded_by: (await window.authService.getCurrentUser()).id
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteFile(fileId, filePathInStorage = null) {
    if (filePathInStorage) {
      const { error: storageError } = await supabaseClient.storage
        .from(window.APP_CONFIG.storageBucket)
        .remove([filePathInStorage]);
      if (storageError) console.warn('Failed to delete from storage:', storageError);
    }
    const { error } = await supabaseClient.from('files').delete().eq('id', fileId);
    if (error) throw error;
    return true;
  }

  /**
   * HOMEWORKS MANAGEMENT
   */
  async getHomeworks(subjectId = null) {
    let query = supabaseClient.from('homeworks').select('*, subjects(name)');
    if (subjectId) query = query.eq('subject_id', subjectId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createHomework(homeworkData, questionsData) {
    try {
      const { data: homework, error: hwError } = await supabaseClient
        .from('homeworks')
        .insert([homeworkData])
        .select()
        .single();
      
      if (hwError) throw hwError;

      if (questionsData && questionsData.length > 0) {
        const questionsToInsert = questionsData.map((q, index) => ({
          ...q,
          homework_id: homework.id,
          order_index: index,
          exam_id: null // Explicitly null
        }));

        const { error: qError } = await supabaseClient
          .from('questions')
          .insert(questionsToInsert);
        
        if (qError) throw qError;
      }

      return homework;
    } catch (error) {
      handleError(error, 'createHomework');
      throw error;
    }
  }

  async deleteHomework(id) {
    const { error } = await supabaseClient.from('homeworks').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async updateHomework(id, updates) {
    const { data, error } = await supabaseClient
      .from('homeworks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * QUESTIONS MANAGEMENT (Direct access if needed)
   */
  async getQuestions(examId = null, homeworkId = null) {
    let query = supabaseClient.from('questions').select('*');
    if (examId) query = query.eq('exam_id', examId);
    if (homeworkId) query = query.eq('homework_id', homeworkId);
    
    const { data, error } = await query.order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  }

  async addQuestion(questionData) {
    const { data, error } = await supabaseClient
      .from('questions')
      .insert([questionData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateQuestion(id, updates) {
    const { data, error } = await supabaseClient
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteQuestion(id) {
    const { error } = await supabaseClient.from('questions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async syncQuestions(parentId, parentType, questionsData) {
    try {
      // 1. Get existing questions
      const { data: existing, error: getError } = await supabaseClient
        .from('questions')
        .select('id')
        .eq(parentType === 'exam' ? 'exam_id' : 'homework_id', parentId);
      
      if (getError) throw getError;

      const existingIds = existing.map(q => q.id);
      const incomingIds = questionsData.map(q => q.id).filter(id => id);

      // 2. Delete questions not in incoming data
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        const { error: delError } = await supabaseClient
          .from('questions')
          .delete()
          .in('id', idsToDelete);
        if (delError) throw delError;
      }

      // 3. Upsert current questions
      const questionsToUpsert = questionsData.map((q, index) => ({
        ...q,
        [parentType === 'exam' ? 'exam_id' : 'homework_id']: parentId,
        order_index: index
      }));

      const { error: upsertError } = await supabaseClient
        .from('questions')
        .upsert(questionsToUpsert);
      
      if (upsertError) throw upsertError;

      return true;
    } catch (error) {
      handleError(error, 'syncQuestions');
      throw error;
    }
  }

  /**
   * EXAMS MANAGEMENT
   */
  async getExams(subjectId = null) {
    let query = supabaseClient.from('exams').select('*, subjects(name)');
    if (subjectId) query = query.eq('subject_id', subjectId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createExam(examData, questionsData) {
    try {
      // 1. Create Exam
      const { data: exam, error: examError } = await supabaseClient
        .from('exams')
        .insert([examData])
        .select()
        .single();
      
      if (examError) throw examError;

      // 2. Create Questions linked to Exam
      if (questionsData && questionsData.length > 0) {
        const questionsToInsert = questionsData.map((q, index) => ({
          ...q,
          exam_id: exam.id,
          homework_id: null,
          order_index: index
        }));

        const { error: qError } = await supabaseClient
          .from('questions')
          .insert(questionsToInsert);
        
        if (qError) throw qError;
      }

      return exam;
    } catch (error) {
      handleError(error, 'createExam');
      throw error;
    }
  }

  async deleteExam(id) {
    const { error } = await supabaseClient.from('exams').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async updateExam(id, updates) {
    const { data, error } = await supabaseClient
      .from('exams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * DASHBOARD STATS
   */
  async getDashboardStats() {
    try {
      const [{ count: students }, { count: subjects }, { count: lessons }, { count: exams }] = await Promise.all([
        supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabaseClient.from('subjects').select('*', { count: 'exact', head: true }),
        supabaseClient.from('lessons').select('*', { count: 'exact', head: true }),
        supabaseClient.from('exams').select('*', { count: 'exact', head: true })
      ]);

      return {
        students: students || 0,
        subjects: subjects || 0,
        lessons: lessons || 0,
        exams: exams || 0
      };
    } catch (error) {
      handleError(error, 'getDashboardStats');
      return { students: 0, subjects: 0, lessons: 0, exams: 0 };
    }
  }

  /**
   * STUDENT MANAGEMENT
   */
  async getStudentsWithStats() {
    try {
      // 1. Get all students
      const { data: students, error: studentError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true });
      
      if (studentError) throw studentError;

      // 2. Get counts of attempts for each student
      const { data: examCounts, error: examError } = await supabaseClient
        .from('exam_attempts')
        .select('student_id');
      
      const { data: hwCounts, error: hwError } = await supabaseClient
        .from('homework_attempts')
        .select('student_id');

      // Helper to count occurrences
      const getCounts = (list) => {
        return (list || []).reduce((acc, curr) => {
          acc[curr.student_id] = (acc[curr.student_id] || 0) + 1;
          return acc;
        }, {});
      };

      const examStats = getCounts(examCounts);
      const hwStats = getCounts(hwCounts);

      return students.map(student => ({
        ...student,
        exam_count: examStats[student.id] || 0,
        homework_count: hwStats[student.id] || 0
      }));
    } catch (error) {
      handleError(error, 'getStudentsWithStats');
      throw error;
    }
  }

  async getStudentDetails(studentId) {
    try {
      // 1. Profile
      const { data: profile, error: pError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (pError) throw pError;

      // 2. Exam Attempts
      const { data: exams, error: eError } = await supabaseClient
        .from('exam_attempts')
        .select('*, exams(title)')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      // 3. Homework Attempts
      const { data: homeworks, error: hError } = await supabaseClient
        .from('homework_attempts')
        .select('*, homeworks(title)')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      return {
        profile,
        exams: exams || [],
        homeworks: homeworks || []
      };
    } catch (error) {
      handleError(error, 'getStudentDetails');
      throw error;
    }
  }

  /**
   * SUBMISSIONS TRACKING
   */
  async getAllSubmissions(limit = 50) {
    try {
      // 1. Fetch Exam Submissions - specify student_id_fkey relationship with alias
      const { data: exams, error: eError } = await supabaseClient
        .from('exam_attempts')
        .select('*, profiles:profiles!exam_attempts_student_id_fkey(full_name), exams(title)')
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (eError) throw eError;

      // 2. Fetch Homework Submissions
      const { data: homeworks, error: hError } = await supabaseClient
        .from('homework_attempts')
        .select('*, profiles(full_name), homeworks(title)')
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (hError) throw hError;

      // 3. Combine and Sort
      const combined = [
        ...exams.map(e => ({ ...e, type: 'exam', activity_title: e.exams?.title })),
        ...homeworks.map(h => ({ ...h, type: 'homework', activity_title: h.homeworks?.title }))
      ];

      return combined
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        .slice(0, limit);
    } catch (error) {
      handleError(error, 'getAllSubmissions');
      throw error;
    }
  }

  async getAttemptDetails(attemptId, type) {
    try {
      const table = type === 'exam' ? 'exam_attempts' : 'homework_attempts';
      const parentRelation = type === 'exam' ? 'exams(title, passing_score)' : 'homeworks(title)';
      const profileJoin = type === 'exam' ? 'profiles!exam_attempts_student_id_fkey(full_name, email, grade_level)' : 'profiles(full_name, email, grade_level)';

      // 1. Get the attempt record
      const { data: attempt, error: aError } = await supabaseClient
        .from(table)
        .select(`*, ${parentRelation}, student: ${profileJoin}`)
        .eq('id', attemptId)
        .single();
      
      if (aError) throw aError;

      // 2. Get the questions
      const parentId = type === 'exam' ? attempt.exam_id : attempt.homework_id;
      const parentField = type === 'exam' ? 'exam_id' : 'homework_id';

      const { data: questions, error: qError } = await supabaseClient
        .from('questions')
        .select('*')
        .eq(parentField, parentId)
        .order('order_index', { ascending: true });
      
      if (qError) throw qError;

      return {
        attempt,
        questions,
        type,
        parentTitle: type === 'exam' ? attempt.exams?.title : attempt.homeworks?.title
      };
    } catch (error) {
      handleError(error, 'getAttemptDetails');
      throw error;
    }
  }
}

// Create global instance
window.adminService = new AdminService();
console.log('✅ Admin service initialized');
