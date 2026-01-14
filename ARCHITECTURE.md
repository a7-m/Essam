# 🏗️ Technical Architecture Summary

## منصة الأستاذ عصام عبدالمنعم التعليمية

---

## 📐 System Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│         Browser (HTML/CSS/JS)           │
├─────────────────────────────────────────┤
│  Pages Layer                            │
│  - Landing, Login, Register             │
│  - Admin Dashboard                      │
│  - Student Portal                       │
│  - Parent Portal                        │
├─────────────────────────────────────────┤
│  Components Layer                       │
│  - Toast Notifications                  │
│  - Modal Dialogs                        │
│  - Form Validation                      │
├─────────────────────────────────────────┤
│  Services Layer                         │
│  - AuthService                          │
│  - AdminService                         │
│  - StudentService                       │
│  - QuizService                          │
├─────────────────────────────────────────┤
│  Utils Layer                            │
│  - Error Handling                       │
│  - Validation                           │
│  - Helpers (format, cache, etc.)        │
└─────────────────────────────────────────┘
            ↓ HTTPS + WebSocket
┌─────────────────────────────────────────┐
│      Supabase Backend (PaaS)            │
├─────────────────────────────────────────┤
│  Authentication                         │
│  - Email/Password                       │
│  - JWT Sessions                         │
├─────────────────────────────────────────┤
│  PostgreSQL Database                    │
│  - 10 Tables                            │
│  - RLS Policies                         │
│  - Auto-grading Functions               │
├─────────────────────────────────────────┤
│  Storage                                │
│  - lesson-files bucket                  │
│  - Secure file uploads                  │
└─────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
profiles (Users)
├── id (PK, FK → auth.users)
├── full_name
├── role (admin/student/parent)
└── grade_level

parent_student_links
├── id (PK)
├── parent_id (FK → profiles)
├── student_id (FK → profiles)
└── status (pending/approved/rejected)

subjects
├── id (PK)
├── name
├── grade_level
└── created_by (FK → profiles)

units
├── id (PK)
├── subject_id (FK → subjects)
├── title
└── order_index

lessons
├── id (PK)
├── unit_id (FK → units)
├── title
├── content
├── order_index
└── is_published

files
├── id (PK)
├── lesson_id (FK → lessons)
├── file_name
├── file_type (pdf/image/youtube)
└── file_url

question_bank
├── id (PK)
├── subject_id (FK → subjects)
├── question_type (mcq/true_false/essay)
├── question_text
├── options (JSONB)
├── correct_answer
└── points

exams
├── id (PK)
├── subject_id (FK → subjects)
├── grade_level
├── duration_minutes
├── max_attempts
├── shuffle_questions
└── is_published

exam_questions
├── id (PK)
├── exam_id (FK → exams)
├── question_id (FK → question_bank)
└── order_index

exam_attempts
├── id (PK)
├── exam_id (FK → exams)
├── student_id (FK → profiles)
├── started_at
├── submitted_at
├── score
├── answers (JSONB)
├── tab_switches
└── is_graded
```

### Key Database Functions

**1. Auto-Grading Function**

```sql
CREATE FUNCTION auto_grade_attempt(attempt_uuid UUID)
RETURNS void
```

- Automatically grades MCQ and True/False questions
- Calculates score and percentage
- Updates `is_graded` flag
- Triggered on `submitted_at` update

**2. Calculate Total Points**

```sql
CREATE FUNCTION calculate_exam_total_points(exam_uuid UUID)
RETURNS INTEGER
```

- Sums up points for all questions in an exam
- Considers `points_override` if set

**3. Admin Profile Creation**

```sql
CREATE FUNCTION create_admin_profile(user_uuid UUID, admin_name TEXT)
RETURNS void
```

- Whitelisted admin creation
- Security check on email

---

## 🔐 Security Architecture

### Row Level Security (RLS) Matrix

| Table         | Admin     | Student                     | Parent                                 |
| ------------- | --------- | --------------------------- | -------------------------------------- |
| profiles      | Full CRUD | Read/Update own             | Read/Update own + Read linked students |
| subjects      | Full CRUD | Read (own grade)            | Read (linked students' grades)         |
| lessons       | Full CRUD | Read published (own grade)  | Read published (linked grades)         |
| question_bank | Full CRUD | No access                   | No access                              |
| exams         | Full CRUD | Read published (own grade)  | Read (linked grades)                   |
| exam_attempts | Full CRUD | Insert/Update own, Read own | Read linked students'                  |
| files         | Full CRUD | Read (accessible lessons)   | Read (accessible lessons)              |

### Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. /auth/signInWithPassword
       ▼
┌─────────────────┐
│ Supabase Auth   │
└──────┬──────────┘
       │ 2. Generate JWT
       ▼
┌─────────────────┐
│  Session Token  │ (Stored in localStorage)
└──────┬──────────┘
       │ 3. Every request includes JWT
       ▼
┌──────────────────┐
│  RLS Policies    │ (Check auth.uid() and role)
└──────┬───────────┘
       │ 4. Allow/Deny
       ▼
┌──────────────────┐
│  Database Query  │
└──────────────────┘
```

### File Upload Security

```javascript
// Client-side validation
- File type check (PDF, JPEG, PNG, WebP)
- File size limit (50MB for admin)
- MIME type validation

// Server-side (Supabase Storage)
- RLS on storage.objects
- Only admin can INSERT/DELETE
- Students/Parents can SELECT only
- Signed URLs for private files
```

---

## 🎯 Quiz System Architecture

### Anti-Cheating Mechanisms

**1. Tab Switching Detection**

```javascript
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    tabSwitchCount++;
    updateAttemptTabSwitches(attemptId, tabSwitchCount);
  }
});
```

**2. Server-Side Timing**

```sql
-- Client submits attempt
-- Server checks:
(submitted_at - started_at) <= (exam.duration_minutes * 60)
```

**3. Server-Side Grading**

```sql
-- All grading logic in PostgreSQL
-- Client cannot manipulate scoring
-- No correct answers sent to client before submission
```

**4. Attempt Limits**

```sql
-- RLS policy prevents creating attempt if:
COUNT(attempts WHERE submitted_at IS NOT NULL) >= exam.max_attempts
```

### Quiz Flow

```
Student starts exam
       ↓
Create exam_attempt (started_at = NOW())
       ↓
Client fetches questions (without correct answers)
       ↓
Student answers questions
       ↓
Client stores answers in local state
       ↓
Timer expires OR Student submits
       ↓
Send answers to server
       ↓
UPDATE exam_attempt SET submitted_at = NOW(), answers = {...}
       ↓
TRIGGER auto_grade_attempt()
       ↓
Return score to client
```

---

## ⚡ Performance Optimizations

### 1. Database Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_attempts_student_exam
  ON exam_attempts(student_id, exam_id);

CREATE INDEX idx_lessons_unit_order
  ON lessons(unit_id, order_index);

CREATE INDEX idx_exams_grade_published
  ON exams(grade_level)
  WHERE is_published = TRUE;
```

### 2. Pagination

```javascript
const PAGE_SIZE = 20;

async function fetchLessons(unitId, page) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  return await supabase
    .from("lessons")
    .select("*", { count: "exact" })
    .range(from, to);
}
```

### 3. Caching Strategy

```javascript
// In-memory cache with TTL
class Cache {
  set(key, value, ttl = 300000) {
    // 5 min
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }
}

// Cache frequently accessed data
appCache.set("subjects_grade_10", subjects, 600000); // 10 min
```

### 4. Lazy Loading Images

```javascript
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});
```

---

## 🎨 UI/UX Architecture

### RTL Support

```css
:root {
  direction: rtl;
  text-align: right;
}

/* Logical properties for RTL compatibility */
.container {
  padding-inline: 1rem; /* Instead of padding-left/right */
  margin-inline: auto;
}

.card {
  border-inline-start: 3px solid var(--primary);
}
```

### Theme System

```javascript
// CSS Variables for theming
:root {
  --bg-primary: #ffffff;
  --text-primary: #1e293b;
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --text-primary: #f1f5f9;
}

// Toggle theme
function toggleTheme() {
  const theme = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
```

### Accessibility Features

- **Keyboard Navigation**: Tab order, focus management
- **ARIA Labels**: `role="alert"`, `aria-live="polite"`
- **Screen Reader Support**: Semantic HTML
- **Focus Trapping**: In modals
- **Color Contrast**: WCAG AA compliant

---

## 🔧 Error Handling

### Centralized Error System

```javascript
class AppError extends Error {
  constructor(message, type, details) {
    super(message);
    this.type = type; // USER_ERROR, AUTH_ERROR, etc.
    this.details = details;
  }
}

function handleError(error, context) {
  // 1. Log full error (dev only)
  // 2. Translate to user-friendly Arabic message
  // 3. Show toast notification
  // 4. Don't expose technical details to user
}
```

### Error Types

- **ValidationError**: بيانات غير صحيحة
- **AuthError**: خطأ في المصادقة
- **PermissionError**: غير مصرح
- **NetworkError**: خطأ في الاتصال
- **SystemError**: خطأ في النظام

---

## 📊 Monitoring & Analytics

### Recommended Metrics

**Performance**

- Page load time (target: < 2s)
- Time to Interactive (target: < 3s)
- Database query time

**Security**

- Failed login attempts
- Tab switches during exams
- File upload violations

**Usage**

- Active students
- Exams completed
- Average scores
- Most accessed lessons

---

## 🚀 Deployment Strategy

### Production Checklist

- ✅ Set SUPABASE_URL and SUPABASE_ANON_KEY
- ✅ Run all migrations
- ✅ Enable RLS on all tables
- ✅ Create Storage bucket
- ✅ Create admin account
- ✅ Set up email templates
- ✅ Enable 2FA for admin
- ✅ Configure CORS
- ✅ Set up custom domain
- ✅ Enable HTTPS
- ✅ Monitor error logs

### Recommended Hosts

1. **Vercel** (Recommended)
   - Free tier available
   - Auto HTTPS
   - Excellent CDN
2. **Netlify**
   - Free tier
   - Easy deployment
3. **Cloudflare Pages**
   - Free tier
   - Global CDN
   - DDoS protection

---

## 🔄 Future Enhancements

### Phase 13: Advanced Features (Optional)

- [ ] Real-time notifications (Supabase Realtime)
- [ ] Email notifications (Supabase Edge Functions)
- [ ] PDF report generation
- [ ] Analytics dashboard
- [ ] Mobile app (PWA)
- [ ] Multi-language support
- [ ] Video conferencing integration
- [ ] Chat/messaging system
- [ ] Gradebook export (Excel)
- [ ] Backup/restore functionality

---

## 📚 Technology Stack Summary

| Layer           | Technology                               |
| --------------- | ---------------------------------------- |
| Frontend        | HTML5, CSS3, Vanilla JavaScript (ES2023) |
| Backend         | Supabase (PostgreSQL, Auth, Storage)     |
| Database        | PostgreSQL 15+                           |
| Authentication  | Supabase Auth (JWT)                      |
| Storage         | Supabase Storage                         |
| Hosting         | Vercel / Netlify / Cloudflare Pages      |
| Version Control | Git                                      |
| No Frameworks   | ✅ No React/Vue/Angular                  |
| No Build Tools  | ✅ No Webpack/Vite (unless needed)       |

---

**Built with ❤️ for education - Production-Ready من اليوم الأول**
