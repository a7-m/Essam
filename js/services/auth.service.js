/**
 * =====================================================
 * Authentication Service
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.sessionKey = 'esam_platform_session';
  }
  
  /**
   * Sign up new user
   */
  async signUp(email, password, userData) {
    try {
      // Validate input
      assert(validators.email(email) === null, validators.email(email));
      assert(validators.password(password) === null, validators.password(password));
      assert(userData.full_name, 'الاسم الكامل مطلوب', ValidationError);
      assert(userData.role, 'نوع المستخدم مطلوب', ValidationError);
      
      // Validate role
      if (!['student', 'parent'].includes(userData.role)) {
        throw new ValidationError('نوع المستخدم غير صحيح');
      }
      
      // Validate grade level for students
      if (userData.role === 'student') {
        assert(
          validators.gradeLevel(userData.grade_level) === null,
          validators.gradeLevel(userData.grade_level),
          ValidationError
        );
      }
      
      // Create auth user with metadata
      // The database trigger will automatically create the profile (if migration applied)
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
            grade_level: userData.role === 'student' ? userData.grade_level : null,
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('فشل إنشاء الحساب');
      }

      const session = authData.session;
      
      // If we have a session, we can check/create the profile
      if (session) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by trigger
        let { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        // If trigger didn't create profile, create it manually (fallback)
        if (!profile) {
          console.log('Trigger not found, creating profile manually...');
          
          const { data: newProfile, error: insertError } = await supabaseClient
            .from('profiles')
            .insert([{
              id: authData.user.id,
              full_name: userData.full_name,
              role: userData.role,
              grade_level: userData.role === 'student' ? userData.grade_level : null,
            }])
            .select()
            .single();
          
          if (insertError) {
            console.error('Manual profile creation failed:', insertError);
            // If we're authenticated but still fail, it's a real error
            throw new Error('فشل إنشاء الملف الشخصي. يرجى التواصل مع الإدارة');
          }
          
          profile = newProfile;
        }

        showSuccess('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول');
        
        return {
          user: authData.user,
          profile,
          session
        };
      } else {
        // No session (email confirmation required)
        console.log('Signup successful, awaiting email confirmation.');
        showSuccess('تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.');
        return {
          user: authData.user,
          profile: null,
          session: null,
          message: 'تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.'
        };
      }
    } catch (error) {
      handleError(error, 'signUp');
      throw error;
    }
  }
  
  /**
   * Sign up parent with student link
   */
  async signUpParent(email, password, userData) {
    try {
      // Validate input
      assert(validators.email(email) === null, validators.email(email));
      assert(validators.password(password) === null, validators.password(password));
      assert(userData.full_name, 'الاسم الكامل مطلوب', ValidationError);
      assert(userData.student_email, 'البريد الإلكتروني للطالب مطلوب', ValidationError);
      assert(validators.email(userData.student_email) === null, 'البريد الإلكتروني للطالب غير صحيح', ValidationError);
      
      // Ensure parent email != student email
      if (email === userData.student_email) {
        throw new ValidationError('يجب أن يكون البريد الإلكتروني للطالب مختلفاً عن بريدك');
      }
      
      // First, verify student exists
      const { data: studentProfile, error: studentError } = await supabaseClient
        .from('profiles')
        .select('id, role')
        .eq('email', userData.student_email)
        .maybeSingle();
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: 'parent',
            phone: userData.phone || null,
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('فشل إنشاء الحساب');
      }

      const session = authData.session;
      
      // If we have a session, create profile and link
      if (session) {
        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by trigger
        let { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        // If trigger didn't create profile, create it manually
        if (!profile) {
          console.log('Creating parent profile manually...');
          
          const { data: newProfile, error: insertError } = await supabaseClient
            .from('profiles')
            .insert([{
              id: authData.user.id,
              full_name: userData.full_name,
              role: 'parent',
            }])
            .select()
            .single();
          
          if (insertError) {
            console.error('Manual profile creation failed:', insertError);
            throw new Error('فشل إنشاء الملف الشخصي. يرجى التواصل مع الإدارة');
          }
          
          profile = newProfile;
        }
        
        // Now create parent-student link if student exists
        if (studentProfile && studentProfile.role === 'student') {
          const { error: linkError } = await supabaseClient
            .from('parent_student_links')
            .insert([{
              parent_id: authData.user.id,
              student_id: studentProfile.id,
              status: 'approved', // Auto-approve as per user request
              approved_at: new Date().toISOString(),
            }]);
          
          if (linkError) {
            console.error('Failed to create student link:', linkError);
            // Don't throw error, just log it - parent account is still created
            showWarning('تم إنشاء حسابك لكن فشل الربط مع الطالب. يرجى التواصل مع الإدارة.');
          } else {
            showSuccess('تم إنشاء الحساب وربطه بحساب الطالب بنجاح!');
          }
        } else {
          // Student not found or not a student role
          showWarning('تم إنشاء حسابك ولكن لم يتم العثور على حساب الطالب. يمكنك ربط الحساب لاحقاً.');
        }
        
        return {
          user: authData.user,
          profile,
          session
        };
      } else {
        // No session (email confirmation required)
        console.log('Parent signup successful, awaiting email confirmation.');
        showSuccess('تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.');
        return {
          user: authData.user,
          profile: null,
          session: null,
          message: 'تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.'
        };
      }
    } catch (error) {
      handleError(error, 'signUpParent');
      throw error;
    }
  }
  
  /**
   * Sign in
   */
  async signIn(email, password) {
    try {
      assert(validators.email(email) === null, validators.email(email));
      assert(validators.required(password) === null, 'كلمة المرور مطلوبة');
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Get profile
      const profile = await this.getProfile(data.user.id);
      
      // Save session
      this.currentUser = {
        ...data.user,
        profile,
      };
      
      storage.set(this.sessionKey, this.currentUser);
      
      showSuccess(`مرحباً ${profile.full_name}!`);
      
      return this.currentUser;
    } catch (error) {
      handleError(error, 'signIn');
      throw error;
    }
  }
  
  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      storage.remove(this.sessionKey);
      
      showInfo('تم تسجيل الخروج بنجاح');
      
      // Redirect to login
      window.location.href = '/login.html';
    } catch (error) {
      handleError(error, 'signOut');
      throw error;
    }
  }
  
  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      // Check cached user first
      if (this.currentUser) {
        return this.currentUser;
      }
      
      // Try from storage
      const cachedUser = storage.get(this.sessionKey);
      if (cachedUser) {
        this.currentUser = cachedUser;
        return this.currentUser;
      }
      
      // Get from Supabase
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) throw error;
      
      if (!session) {
        return null;
      }
      
      // Get profile
      const profile = await this.getProfile(session.user.id);
      
      this.currentUser = {
        ...session.user,
        profile,
      };
      
      storage.set(this.sessionKey, this.currentUser);
      
      return this.currentUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  /**
   * Get user profile
   */
  async getProfile(userId) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update profile
   */
  async updateProfile(updates) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new AuthError('يجب تسجيل الدخول أولاً');
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update cached user
      this.currentUser.profile = data;
      storage.set(this.sessionKey, this.currentUser);
      
      showSuccess('تم تحديث الملف الشخصي بنجاح');
      
      return data;
    } catch (error) {
      handleError(error, 'updateProfile');
      throw error;
    }
  }
  
  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      assert(validators.email(email) === null, validators.email(email));
      
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`,
      });
      
      if (error) throw error;
      
      showSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      
      return true;
    } catch (error) {
      handleError(error, 'resetPassword');
      throw error;
    }
  }
  
  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      assert(validators.password(newPassword) === null, validators.password(newPassword));
      
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      showSuccess('تم تغيير كلمة المرور بنجاح');
      
      return true;
    } catch (error) {
      handleError(error, 'updatePassword');
      throw error;
    }
  }
  
  /**
   * Check if user has specific role
   */
  async checkRole(requiredRole) {
    const user = await this.getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.profile.role);
    }
    
    return user.profile.role === requiredRole;
  }
  
  /**
   * Require authentication (redirect if not logged in)
   */
  async requireAuth(redirectTo = '/login.html') {
    const user = await this.getCurrentUser();
    if (!user) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  }
  
  /**
   * Require specific role (redirect if unauthorized)
   */
  async requireRole(role, redirectTo = '/unauthorized.html') {
    const user = await this.requireAuth();
    if (!user) return null;
    
    const hasRole = await this.checkRole(role);
    if (!hasRole) {
      showError('غير مصرح لك بالوصول إلى هذه الصفحة');
      window.location.href = redirectTo;
      return null;
    }
    
    return user;
  }
  
  /**
   * Setup auth state listener
   */
  onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const profile = await this.getProfile(session.user.id);
        this.currentUser = {
          ...session.user,
          profile,
        };
        storage.set(this.sessionKey, this.currentUser);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        storage.remove(this.sessionKey);
      }
      
      if (callback) callback(event, session);
    });
  }
}

// Create global instance
window.authService = new AuthService();

console.log('✅ Auth service initialized');
