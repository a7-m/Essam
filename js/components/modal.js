/**
 * =====================================================
 * Modal Component
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

/**
 * Create and show modal
 * @param {Object} options - Modal configuration
 * @returns {HTMLElement} - Modal element
 */
function showModal(options = {}) {
  const {
    title = '',
    content = '',
    size = 'medium', // small, medium, large, full
    showClose = true,
    onClose = null,
    footer = null,
    closeOnBackdrop = true,
  } = options;
  
  // Create modal wrapper
  const modalWrapper = document.createElement('div');
  modalWrapper.className = 'modal-wrapper';
  modalWrapper.setAttribute('role', 'dialog');
  modalWrapper.setAttribute('aria-modal', 'true');
  modalWrapper.setAttribute('aria-labelledby', 'modal-title');
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  if (closeOnBackdrop) {
    backdrop.onclick = () => closeModal(modalWrapper, onClose);
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = `modal modal-${size}`;
  
  // Modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2 id="modal-title" class="modal-title">${title}</h2>
    ${showClose ? '<button class="modal-close" aria-label="إغلاق">×</button>' : ''}
  `;
  
  if (showClose) {
    header.querySelector('.modal-close').onclick = () => closeModal(modalWrapper, onClose);
  }
  
  // Modal body
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }
  
  // Modal footer
  let footerElement = null;
  if (footer) {
    footerElement = document.createElement('div');
    footerElement.className = 'modal-footer';
    if (typeof footer === 'string') {
      footerElement.innerHTML = footer;
    } else if (footer instanceof HTMLElement) {
      footerElement.appendChild(footer);
    }
  }
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(body);
  if (footerElement) modal.appendChild(footerElement);
  
  modalWrapper.appendChild(backdrop);
  modalWrapper.appendChild(modal);
  document.body.appendChild(modalWrapper);
  
  // Trap focus in modal
  trapFocus(modal);
  
  // Animate in
  setTimeout(() => modalWrapper.classList.add('show'), 10);
  
  // Focus first focusable element
  const firstFocusable = modal.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) {
    setTimeout(() => firstFocusable.focus(), 100);
  }
  
  // Handle ESC key
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal(modalWrapper, onClose);
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  return modalWrapper;
}

/**
 * Close modal
 */
function closeModal(modalElement, callback = null) {
  if (!modalElement) return;
  
  modalElement.classList.remove('show');
  setTimeout(() => {
    modalElement.remove();
    if (callback) callback();
  }, 300);
}

/**
 * Confirmation modal
 */
function showConfirm(options = {}) {
  const {
    title = 'تأكيد',
    message = 'هل أنت متأكد؟',
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    confirmClass = 'btn-danger',
    onConfirm = null,
    onCancel = null,
  } = options;
  
  return new Promise((resolve) => {
    const footer = document.createElement('div');
    footer.innerHTML = `
      <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
      <button class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
    `;
    
    const modal = showModal({
      title,
      content: `<p>${message}</p>`,
      size: 'small',
      footer,
      closeOnBackdrop: false,
    });
    
    footer.querySelector('[data-action="cancel"]').onclick = () => {
      closeModal(modal);
      if (onCancel) onCancel();
      resolve(false);
    };
    
    footer.querySelector('[data-action="confirm"]').onclick = () => {
      closeModal(modal);
      if (onConfirm) onConfirm();
      resolve(true);
    };
  });
}

/**
 * Alert modal
 */
function showAlert(options = {}) {
  const {
    title = 'تنبيه',
    message = '',
    okText = 'حسناً',
    onClose = null,
  } = options;
  
  return new Promise((resolve) => {
    const footer = document.createElement('div');
    footer.innerHTML = `<button class="btn btn-primary" data-action="ok">${okText}</button>`;
    
    const modal = showModal({
      title,
      content: `<p>${message}</p>`,
      size: 'small',
      footer,
      closeOnBackdrop: false,
    });
    
    footer.querySelector('[data-action="ok"]').onclick = () => {
      closeModal(modal);
      if (onClose) onClose();
      resolve(true);
    };
  });
}

/**
 * Trap focus within element
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}

// Export
window.showModal = showModal;
window.closeModal = closeModal;
window.showConfirm = showConfirm;
window.showAlert = showAlert;

console.log('✅ Modal component initialized');
