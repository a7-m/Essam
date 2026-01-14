# 📋 Supabase Setup Checklist

استخدم هذا الملف كدليل خطوة بخطوة لإعداد Supabase للمشروع.

## ✅ الخطوات المطلوبة

### 1. إنشاء Supabase Project

- [ ] اذهب إلى [supabase.com](https://supabase.com)
- [ ] سجل الدخول أو أنشئ حساب جديد
- [ ] اضغط "New Project"
- [ ] املأ البيانات:
  - **Name**: esam-educational-platform
  - **Database Password**: [احتفظ بكلمة مرور قوية]
  - **Region**: اختر أقرب منطقة (Middle East إن وجدت)
- [ ] انتظر حتى يتم إنشاء المشروع (دقيقتين تقريباً)

### 2. نسخ الـ Credentials

- [ ] من Project Settings → API
- [ ] انسخ:
  - **Project URL**: `https://xxxx.supabase.co`
  - **anon/public key**: `eyJhbGc...`
- [ ] الصق في `js/config.js`:
  ```javascript
  const SUPABASE_URL = "URL_HERE";
  const SUPABASE_ANON_KEY = "KEY_HERE";
  ```

### 3. تشغيل Database Migrations

اذهب إلى **SQL Editor** في Supabase Dashboard، ثم شغّل الملفات **بالترتيب**:

#### Migration 1: Core Schema

- [ ] افتح `supabase/migrations/0001_init_schema.sql`
- [ ] انسخ المحتوى بالكامل
- [ ] الصقه في SQL Editor
- [ ] اضغط RUN
- [ ] تأكد من ظهور: "Migration 0001 completed successfully"

#### Migration 2: Quiz System

- [ ] افتح `supabase/migrations/0002_quiz_system.sql`
- [ ] انسخ المحتوى
- [ ] الصق في SQL Editor
- [ ] اضغط RUN
- [ ] تأكد من ظهور: "Migration 0002 completed successfully"

#### Migration 3: Indexes

- [ ] افتح `supabase/migrations/0003_indexes.sql`
- [ ] انسخ المحتوى
- [ ] الصق في SQL Editor
- [ ] اضغط RUN
- [ ] تأكد من ظهور: "Migration 0003 completed successfully"

#### Migration 4: RLS Policies

- [ ] افتح `supabase/migrations/0004_rls_policies.sql`
- [ ] انسخ المحتوى
- [ ] الصق في SQL Editor
- [ ] اضغط RUN
- [ ] تأكد من ظهور: "Migration 0004 completed successfully"

### 4. التحقق من الجداول

- [ ] اذهب إلى **Table Editor**
- [ ] تأكد من وجود الجداول التالية:
  - profiles
  - parent_student_links
  - subjects
  - units
  - lessons
  - files
  - question_bank
  - exams
  - exam_questions
  - exam_attempts

### 5. إنشاء Storage Bucket

- [ ] اذهب إلى **Storage**
- [ ] اضغط "New Bucket"
- [ ] املأ:
  - **Name**: lesson-files
  - **Public bucket**: ✗ (لا تفعّلها - اتركها private)
- [ ] اضغط "Create Bucket"

### 6. إنشاء Admin User

#### الخطوة 1: إنشاء المستخدم في Auth

- [ ] اذهب إلى **Authentication** → **Users**
- [ ] اضغط "Add User"
- [ ] املأ:
  - **Email**: admin@example.com (أو البريد المفضل)
  - **Password**: [كلمة مرور قوية - احتفظ بها]
  - **Auto Confirm User**: ✓ (فعّلها)
- [ ] اضغط "Create User"
- [ ] **انسخ UUID** الذي ظهر (مثال: `a1b2c3d4-e5f6-7890-...`)

#### الخطوة 2: إنشاء Profile للأدمن

- [ ] اذهب إلى **SQL Editor**
- [ ] شغّل هذا الكود (استبدل UUID):
  ```sql
  INSERT INTO profiles (id, full_name, role, grade_level)
  VALUES (
    'UUID_HERE'::uuid, -- استبدل بالـ UUID الفعلي
    'الأستاذ عصام عبدالمنعم',
    'admin',
    NULL
  );
  ```
- [ ] اضغط RUN
- [ ] تأكد من عدم وجود أخطاء

#### الخطوة 3: التحقق

- [ ] اذهب إلى **Table Editor** → **profiles**
- [ ] تأكد من وجود سجل واحد:
  - role = admin
  - full_name = الأستاذ عصام عبدالمنعم

### 7. اختبار المصادقة

- [ ] افتح المشروع في المتصفح
- [ ] اذهب إلى `/login.html`
- [ ] سجل الدخول بـ:
  - Email: admin@example.com
  - Password: [كلمة المرور التي أنشأتها]
- [ ] يجب أن يتم تحويلك إلى `/admin/dashboard.html`

### 8. إعداد Email Templates (اختياري)

إذا كنت تريد تخصيص رسائل البريد:

- [ ] اذهب إلى **Authentication** → **Email Templates**
- [ ] عدّل القوالب:
  - Confirm signup
  - Reset password
  - Magic link
  - Change email address

## 🔍 استكشاف الأخطاء

### ❌ الخطأ: "relation does not exist"

- **السبب**: لم يتم تشغيل Migrations
- **الحل**: راجع الخطوة 3 وتأكد من تشغيل جميع Migrations بالترتيب

### ❌ الخطأ: "new row violates row-level security policy"

- **السبب**: لم يتم تطبيق RLS Policies
- **الحل**: شغّل Migration 4 (RLS Policies)

### ❌ لا يمكن تسجيل الدخول

- **السبب**: لم يتم إنشاء profile للمستخدم
- **الحل**: راجع الخطوة 6 وتأكد من إنشاء profile في جدول profiles

### ❌ الخطأ: "Failed to fetch"

- **السبب**: SUPABASE_URL أو SUPABASE_ANON_KEY خاطئ
- **الحل**: راجع الخطوة 2 وتأكد من نسخ القيم الصحيحة

## ✅ الإعداد مكتمل!

بعد إتمام جميع الخطوات أعلاه، المنصة جاهزة للاستخدام!

يمكنك الآن:

- ✅ تسجيل الدخول كأدمن
- ✅ إنشاء مواد ووحدات ودروس
- ✅ رفع الملفات
- ✅ إنشاء الاختبارات
- ✅ تسجيل الطلاب

---

**في حال واجهتك أي مشكلة، راجع README.md أو الوثائق الرسمية لـ Supabase**
