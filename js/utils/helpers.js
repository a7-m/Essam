/**
 * =====================================================
 * Helper Utilities
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

/**
 * Format date in Arabic
 */
function formatDate(date, format = 'full') {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return '-';
  
  const options = {
    full: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
    },
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  };
  
  return d.toLocaleDateString('ar-AE', options[format] || options.full);
}

/**
 * Format relative time (e.g., "منذ ساعتين")
 */
function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  
  return formatDate(date, 'date');
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration (minutes to hours:minutes)
 */
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} دقيقة`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours} ساعة`;
  return `${hours} ساعة و ${mins} دقيقة`;
}

/**
 * Format percentage
 */
function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Debounce function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Generate UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Shuffle array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get query parameter from URL
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Update URL query parameter without reload
 */
function updateQueryParam(param, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
  }
  window.history.pushState({}, '', url);
}

/**
 * Parse YouTube video ID from URL
 */
function parseYouTubeId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Get YouTube embed URL
 */
function getYouTubeEmbedUrl(url) {
  const videoId = parseYouTubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

/**
 * Local storage helpers with JSON support
 */
const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing localStorage:', e);
      return false;
    }
  },
};

/**
 * Session storage helpers
 */
const session = {
  set: (key, value) => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to sessionStorage:', e);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error reading from sessionStorage:', e);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from sessionStorage:', e);
      return false;
    }
  },
  
  clear: () => {
    try {
      window.sessionStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing sessionStorage:', e);
      return false;
    }
  },
};

/**
 * Simple cache with TTL
 */
class Cache {
  constructor() {
    this.cache = new Map();
  }
  
  set(key, value, ttl = 300000) { // 5 min default
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  has(key) {
    return this.get(key) !== null;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Export
window.formatDate = formatDate;
window.formatRelativeTime = formatRelativeTime;
window.formatFileSize = formatFileSize;
window.formatDuration = formatDuration;
window.formatPercentage = formatPercentage;
window.debounce = debounce;
window.throttle = throttle;
window.deepClone = deepClone;
window.generateUUID = generateUUID;
window.shuffleArray = shuffleArray;
window.getQueryParam = getQueryParam;
window.updateQueryParam = updateQueryParam;
window.parseYouTubeId = parseYouTubeId;
window.getYouTubeEmbedUrl = getYouTubeEmbedUrl;
window.storage = storage;
window.session = session;
window.Cache = Cache;

// Create global cache instance
window.appCache = new Cache();

console.log('✅ Helper utilities initialized');
