/**
 * =====================================================
 * Theme Manager
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

const ThemeManager = {
  // Theme constants
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
  },

  // Storage key
  STORAGE_KEY: 'theme_preference',

  /**
   * Initialize theme manager
   */
  init() {
    this.applyTheme(this.getStoredTheme());
    
    // Inject theme toggle button if it doesn't exist
    if (!document.getElementById('theme-toggle-btn')) {
      this.injectThemeToggle();
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.getStoredTheme() === this.THEMES.SYSTEM) {
        this.applyTheme(this.THEMES.SYSTEM);
      }
    });

    console.log('✅ Theme Manager initialized');
  },

  /**
   * Inject theme toggle button into DOM
   */
  injectThemeToggle() {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.className = 'theme-toggle';
    btn.onclick = () => this.cycleTheme();
    btn.innerHTML = this.getThemeIcon(this.getStoredTheme());
    btn.title = `الوضع: ${this.getThemeLabel(this.getStoredTheme())}`;
    
    // Append to body
    document.body.appendChild(btn);
  },

  /**
   * Get stored theme preference
   */
  getStoredTheme() {
    return localStorage.getItem(this.STORAGE_KEY) || this.THEMES.SYSTEM;
  },

  /**
   * Set theme preference
   * @param {string} theme - 'light', 'dark', or 'system'
   */
  setTheme(theme) {
    if (!Object.values(this.THEMES).includes(theme)) {
      console.error('Invalid theme:', theme);
      return;
    }
    
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
    this.updateUI(theme);
  },

  /**
   * Apply theme to document
   * @param {string} theme 
   */
  applyTheme(theme) {
    const root = document.documentElement;
    let effectiveTheme = theme;

    if (theme === this.THEMES.SYSTEM) {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemDark ? this.THEMES.DARK : this.THEMES.LIGHT;
    }

    if (effectiveTheme === this.THEMES.DARK) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  },

  /**
   * Cycle to next theme (Light -> Dark -> System -> Light)
   */
  cycleTheme() {
    const current = this.getStoredTheme();
    let next;

    switch (current) {
      case this.THEMES.LIGHT:
        next = this.THEMES.DARK;
        break;
      case this.THEMES.DARK:
        next = this.THEMES.SYSTEM;
        break;
      default:
        next = this.THEMES.LIGHT;
        break;
    }

    this.setTheme(next);
    return next;
  },

  /**
   * Get icon for current theme
   */
  getThemeIcon(theme) {
    switch (theme) {
      case this.THEMES.LIGHT: return '☀️';
      case this.THEMES.DARK: return '🌙';
      case this.THEMES.SYSTEM: return '💻';
      default: return '☀️';
    }
  },
  
  /**
   * get label for current theme (Arabic)
   */
  getThemeLabel(theme) {
     switch (theme) {
      case this.THEMES.LIGHT: return 'فاتح';
      case this.THEMES.DARK: return 'داكن';
      case this.THEMES.SYSTEM: return 'النظام';
      default: return 'فاتح';
    }
  },

  /**
   * Update UI elements (if any exist)
   */
  updateUI(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = this.getThemeIcon(theme);
      btn.title = `الوضع: ${this.getThemeLabel(theme)}`;
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
});

// Export
window.ThemeManager = ThemeManager;
