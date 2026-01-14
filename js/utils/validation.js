/**
 * =====================================================
 * Validation Utilities
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

/**
 * Validation Rules
 */
const validators = {
  /**
   * Validate email format
   */
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'البريد الإلكتروني مطلوب';
    if (!emailRegex.test(email)) return 'البريد الإلكتروني غير صحيح';
    return null;
  },
  
  /**
   * Validate password strength
   */
  password: (password) => {
    if (!password) return 'كلمة المرور مطلوبة';
    if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (!/[a-zA-Z]/.test(password)) return 'كلمة المرور يجب أن تحتوي على أحرف';
    if (!/[0-9]/.test(password)) return 'كلمة المرور يجب أن تحتوي على أرقام';
    return null;
  },
  
  /**
   * Validate password confirmation
   */
  passwordMatch: (password, confirmPassword) => {
    if (password !== confirmPassword) return 'كلمة المرور غير متطابقة';
    return null;
  },
  
  /**
   * Validate required field
   */
  required: (value, fieldName = 'هذا الحقل') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} مطلوب`;
    }
    return null;
  },
  
  /**
   * Validate grade level
   */
  gradeLevel: (grade) => {
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum)) return 'الصف الدراسي غير صحيح';
    if (gradeNum < 5 || gradeNum > 12) return 'الصف الدراسي يجب أن يكون بين 5 و 12';
    return null;
  },
  
  /**
   * Validate phone number (optional - Omani format)
   */
  phone: (phone) => {
    if (!phone) return null; // Optional field
    const phoneRegex = /^(\\+968)?[79]\d{7}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'رقم الهاتف غير صحيح';
    }
    return null;
  },
  
  /**
   * Validate number range
   */
  range: (value, min, max, fieldName = 'القيمة') => {
    const num = parseFloat(value);
    if (isNaN(num)) return `${fieldName} يجب أن يكون رقماً`;
    if (num < min || num > max) return `${fieldName} يجب أن يكون بين ${min} و ${max}`;
    return null;
  },
  
  /**
   * Validate minimum length
   */
  minLength: (value, min, fieldName = 'هذا الحقل') => {
    if (!value) return null;
    if (value.length < min) return `${fieldName} يجب أن يحتوي على ${min} أحرف على الأقل`;
    return null;
  },
  
  /**
   * Validate maximum length
   */
  maxLength: (value, max, fieldName = 'هذا الحقل') => {
    if (!value) return null;
    if (value.length > max) return `${fieldName} يجب ألا يتجاوز ${max} حرف`;
    return null;
  },
  
  /**
   * Validate URL format
   */
  url: (url) => {
    if (!url) return null; // Optional
    try {
      new URL(url);
      return null;
    } catch {
      return 'الرابط غير صحيح';
    }
  },
  
  /**
   * Validate YouTube URL
   */
  youtubeUrl: (url) => {
    if (!url) return null;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) return 'رابط يوتيوب غير صحيح';
    return null;
  },
  
  /**
   * Validate file type
   */
  fileType: (file, allowedTypes) => {
    if (!file) return 'الملف مطلوب';
    if (!allowedTypes.includes(file.type)) {
      return `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`;
    }
    return null;
  },
  
  /**
   * Validate file size
   */
  fileSize: (file, maxSize) => {
    if (!file) return 'الملف مطلوب';
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
      return `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB} ميجابايت`;
    }
    return null;
  },
  
  /**
   * Validate date
   */
  date: (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'التاريخ غير صحيح';
    return null;
  },
  
  /**
   * Validate date range
   */
  dateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية';
    return null;
  },
};

/**
 * Form validation helper
 */
function validateForm(formData, rules) {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = formData[field];
    
    for (const rule of fieldRules) {
      let error = null;
      
      if (typeof rule === 'function') {
        error = rule(value);
      } else if (typeof rule === 'object') {
        const { validator, params, message } = rule;
        error = validator(value, ...params);
        if (error && message) error = message;
      }
      
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Display validation errors on form
 */
function displayFormErrors(errors) {
  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  document.querySelectorAll('.input-error').forEach(el => {
    el.classList.remove('input-error');
  });
  
  // Display new errors
  for (const [field, message] of Object.entries(errors)) {
    const input = document.querySelector(`[name="${field}"]`);
    if (input) {
      input.classList.add('input-error');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      errorDiv.setAttribute('role', 'alert');
      
      input.parentElement.appendChild(errorDiv);
      
      // Focus first error
      if (Object.keys(errors)[0] === field) {
        input.focus();
      }
    }
  }
}

/**
 * Sanitize user input (prevent XSS)
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize HTML (allow limited tags)
 */
function sanitizeHTML(html, allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']) {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove all tags except allowed ones
  const walk = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        // Replace with text content
        const text = document.createTextNode(node.textContent);
        node.parentNode.replaceChild(text, node);
      } else {
        // Check children
        Array.from(node.childNodes).forEach(walk);
      }
    }
  };
  
  Array.from(div.childNodes).forEach(walk);
  return div.innerHTML;
}

// Export
window.validators = validators;
window.validateForm = validateForm;
window.displayFormErrors = displayFormErrors;
window.sanitizeInput = sanitizeInput;
window.sanitizeHTML = sanitizeHTML;

console.log('✅ Validation utilities initialized');
