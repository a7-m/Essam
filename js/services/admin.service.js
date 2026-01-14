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
}

// Create global instance
window.adminService = new AdminService();
console.log('✅ Admin service initialized');
