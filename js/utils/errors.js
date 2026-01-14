/**
 * =====================================================
 * Error Handling Utilities
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

/**
 * Custom Error Classes
 */
class AppError extends Error {
  constructor(message, type = 'USER_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

class AuthError extends AppError {
  constructor(message) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

class PermissionError extends AppError {
  constructor(message) {
    super(message, 'PERMISSION_ERROR');
    this.name = 'PermissionError';
  }
}

class NetworkError extends AppError {
  constructor(message) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 'USER_ERROR');
    this.name = 'NotFoundError';
  }
}

/**
 * Error Type Definitions
 */
const ERROR_TYPES = {
  USER_ERROR: 'خطأ',
  VALIDATION_ERROR: 'خطأ في البيانات',
  AUTH_ERROR: 'خطأ في المصادقة',
  PERMISSION_ERROR: 'غير مصرح',
  NETWORK_ERROR: 'خطأ في الاتصال',
  SYSTEM_ERROR: 'خطأ في النظام',
  SECURITY_ERROR: 'خطأ أمني',
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  // Authentication
  'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً',
  'User already registered': 'هذا البريد الإلكتروني مسجل مسبقاً',
  'Weak password': 'كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل',
  
  // Network
  'Failed to fetch': 'فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت',
  'Network request failed': 'فشل الاتصال بالخادم',
  
  // Permissions
  'PGRST116': 'غير مصرح لك بالوصول إلى هذه البيانات',
  'JWT expired': 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى',
  
  // Database
  'duplicate key value': 'هذا السجل موجود مسبقاً',
  'foreign key violation': 'لا يمكن حذف هذا السجل لأنه مرتبط ببيانات أخرى',
  'violates check constraint': 'البيانات المدخلة غير صالحة',
  
  // Generic
  'Unknown error': 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
};

/**
 * Translate error message to Arabic
 */
function translateError(errorMessage) {
  if (!errorMessage) return ERROR_MESSAGES['Unknown error'];
  
  // Check for exact match
  if (ERROR_MESSAGES[errorMessage]) {
    return ERROR_MESSAGES[errorMessage];
  }
  
  // Check for partial match
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }
  
  // Return generic message (don't expose technical details to user)
  return 'حدث خطأ. يرجى المحاولة مرة أخرى';
}

/**
 * Handle different types of errors
 */
function handleError(error, context = '') {
  console.error(`Error in ${context}:`, error);
  
  let userMessage = 'حدث خطأ غير متوقع';
  let errorType = 'SYSTEM_ERROR';
  
  // Handle custom app errors
  if (error instanceof AppError) {
    userMessage = error.message;
    errorType = error.type;
  }
  // Handle Supabase errors
  else if (error?.error) {
    userMessage = translateError(error.error.message || error.message);
    errorType = 'USER_ERROR';
  }
  // Handle Auth errors
  else if (error?.message?.includes('auth')) {
    userMessage = translateError(error.message);
    errorType = 'AUTH_ERROR';
  }
  // Handle network errors
  else if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    userMessage = ERROR_MESSAGES['Failed to fetch'];
    errorType = 'NETWORK_ERROR';
  }
  // Handle Postgres errors
  else if (error?.code) {
    if (error.code === 'PGRST116') {
      userMessage = ERROR_MESSAGES['PGRST116'];
      errorType = 'PERMISSION_ERROR';
    } else {
      userMessage = translateError(error.message);
    }
  }
  // Handle generic errors
  else if (error?.message) {
    userMessage = translateError(error.message);
  }
  
  // Show error to user (using toast notification)
  if (window.showToast) {
    window.showToast(userMessage, 'error');
  } else {
    // Fallback to alert if toast not available
    alert(userMessage);
  }
  
  // Log full error for debugging (only in development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.group('🔴 Error Details');
    console.log('Type:', errorType);
    console.log('Message:', userMessage);
    console.log('Original:', error);
    console.groupEnd();
  }
  
  return {
    type: errorType,
    message: userMessage,
    original: error,
  };
}

/**
 * Handle async operations with error handling
 */
async function tryCatch(asyncFn, context = '') {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context);
    throw error; // Re-throw for caller to handle if needed
  }
}

/**
 * Validate and throw error if condition fails
 */
function assert(condition, message, ErrorClass = ValidationError) {
  if (!condition) {
    throw new ErrorClass(message);
  }
}

// Export
window.AppError = AppError;
window.ValidationError = ValidationError;
window.AuthError = AuthError;
window.PermissionError = PermissionError;
window.NetworkError = NetworkError;
window.NotFoundError = NotFoundError;
window.handleError = handleError;
window.tryCatch = tryCatch;
window.assert = assert;

console.log('✅ Error handling initialized');
