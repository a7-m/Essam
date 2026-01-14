/**
 * =====================================================
 * Supabase Configuration
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

// ⚠️ REPLACE WITH YOUR ACTUAL SUPABASE CREDENTIALS
const SUPABASE_URL = "https://snpeefmoyeqdxygivclg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGVlZm1veWVxZHh5Z2l2Y2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzgxMjQsImV4cCI6MjA4MzgxNDEyNH0.ApTDLCfJuJsUCcLP2feV2YHJeAAfdT0qFJ5tJYv9QXY";

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App Configuration
const APP_CONFIG = {
  name: "منصة الأستاذ عصام عبدالمنعم",
  teacher: "الأستاذ عصام عبدالمنعم",
  subjects: ["اللغة العربية", "التربية الإسلامية"],
  grades: [5, 6, 7, 8, 9, 10, 11, 12],
  curriculum: "منهج سلطنة عُمان",

  // File upload limits
  maxFileSize: {
    admin: 50 * 1024 * 1024, // 50MB
    student: 0, // Students cannot upload
    parent: 0, // Parents cannot upload
  },

  allowedFileTypes: {
    pdf: ["application/pdf"],
    image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    video: ["video/mp4", "video/webm"],
  },

  // Pagination
  pageSize: 20,

  // Quiz settings
  quiz: {
    minDuration: 5, // minutes
    maxDuration: 180, // 3 hours
    defaultDuration: 30,
    warningTimeLeft: 5, // Show warning at 5 min
  },

  // Storage bucket
  storageBucket: "lesson-files",
};

// Export for use in other modules
window.APP_CONFIG = APP_CONFIG;
window.supabaseClient = supabaseClient;

console.log("✅ Supabase initialized");
console.log("📚 Platform:", APP_CONFIG.name);
