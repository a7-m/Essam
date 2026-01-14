/**
 * =====================================================
 * Toast Notification Component
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, warning, info
 * @param {number} duration - Duration in ms (0 = permanent)
 */
function showToast(message, type = 'info', duration = 5000) {
  // Create container if not exists
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'الإشعارات');
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  // Icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="إغلاق" onclick="this.parentElement.remove()">×</button>
  `;
  
  // Add to container
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast;
}

/**
 * Show success toast
 */
function showSuccess(message, duration = 5000) {
  return showToast(message, 'success', duration);
}

/**
 * Show error toast
 */
function showError(message, duration = 7000) {
  return showToast(message, 'error', duration);
}

/**
 * Show warning toast
 */
function showWarning(message, duration = 6000) {
  return showToast(message, 'warning', duration);
}

/**
 * Show info toast
 */
function showInfo(message, duration = 5000) {
  return showToast(message, 'info', duration);
}

/**
 * Clear all toasts
 */
function clearToasts() {
  const container = document.getElementById('toast-container');
  if (container) {
    container.innerHTML = '';
  }
}

// Export to window
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.clearToasts = clearToasts;

console.log('✅ Toast component initialized');
