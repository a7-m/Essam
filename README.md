# 📚 منصة الأستاذ عصام عبدالمنعم التعليمية

منصة تعليمية احترافية Production-Ready للأستاذ عصام عبدالمنعم  
**معلم اللغة العربية والتربية الإسلامية**  
للصفوف 5 – 12 وفق منهج سلطنة عُمان

## 🎯 نظرة عامة

منصة تعليمية متكاملة تم بناؤها باستخدام:

- ✅ HTML5 + CSS3 + Vanilla JavaScript (ES2023)
- ✅ Supabase (Auth + Database + Storage)
- ❌ بدون Frameworks (No React/Vue/Angular)
- ❌ بدون اشتراكات أو مدفوعات

## 👥 أنواع المستخدمين

### 1. Admin (الأستاذ)

- إدارة كاملة للمنصة
- إنشاء وتعديل: الصفوف، المواد، الوحدات، الدروس
- رفع الملفات (PDF, Images, YouTube Videos)
- إنشاء بنك الأسئلة
- بناء الاختبارات
- عرض نتائج جميع الطلاب

### 2. Student (الطالب)

- الوصول للدروس والملفات
- إجراء الاختبارات
- عرض النتائج الفورية
- مراجعة الإجابات

### 3. Parent (ولي الأمر)

- ربط مع حساب الطالب
- عرض النتائج والتقارير (Read-Only)
- متابعة الأداء الدراسي

## 🗂️ هيكل المشروع

```
esam-platform/
├── index.html                 # الصفحة الرئيسية
├── login.html                 # تسجيل الدخول
├── register-student.html      # تسجيل طالب
├── register-parent.html       # تسجيل ولي أمر
├── admin/                     # لوحات تحكم الأدمن
│   ├── dashboard.html
│   ├── subjects.html
│   ├── lessons.html
│   ├── questions.html
│   └── exams.html
├── student/                   # بوابة الطالب
│   ├── dashboard.html
│   ├── lessons.html
│   └── exams.html
├── parent/                    # بوابة ولي الأمر
│   └── dashboard.html
├── css/
│   ├── main.css              # الأنماط الأساسية
│   ├── components.css        # مكونات UI
│   └── themes.css            # الثيمات
├── js/
│   ├── config.js             # إعدادات Supabase
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── admin.service.js
│   │   ├── student.service.js
│   │   └── quiz.service.js
│   ├── utils/
│   │   ├── validation.js
│   │   ├── errors.js
│   │   └── helpers.js
│   └── components/
│       ├── toast.js
│       └── modal.js
└── supabase/
    ├── migrations/           # SQL Migrations
    └── create_admin.sql     # سكريبت إنشاء الأدمن
```

## 🚀 التثبيت والإعداد

### 1. إنشاء Supabase Project

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب جديد أو سجل الدخول
3. أنشئ مشروع جديد
4. احتفظ بـ URL و Anon Key

### 2. تشغيل Migrations

في Supabase Dashboard → SQL Editor، قم بتشغيل الملفات التالية **بالترتيب**:

```sql
-- 1. Core Schema
(نسخ محتوى supabase/migrations/0001_init_schema.sql)

-- 2. Quiz System
(نسخ محتوى supabase/migrations/0002_quiz_system.sql)

-- 3. Indexes
(نسخ محتوى supabase/migrations/0003_indexes.sql)

-- 4. RLS Policies
(نسخ محتوى supabase/migrations/0004_rls_policies.sql)
```

### 3. إعداد Storage

في Supabase Dashboard → Storage:

1. أنشئ Bucket جديد باسم `lesson-files`
2. اجعله **Private** (ليس Public)
3. سيتم التحكم في الصلاحيات عبر RLS

### 4. إنشاء Admin Account

#### الطريقة الأولى (يدوياً):

1. اذهب إلى Authentication → Users في Supabase
2. أنشئ مستخدم جديد:
   - Email: admin@example.com
   - Password: [كلمة مرور قوية]
3. احصل على UUID للمستخدم
4. شغل SQL التالي في SQL Editor:

```sql
-- استبدل UUID_HERE بالـ UUID الفعلي
INSERT INTO profiles (id, full_name, role)
VALUES (
  'UUID_HERE'::uuid,
  'الأستاذ عصام عبدالمنعم',
  'admin'
);
```

#### الطريقة الثانية (عبر Function):

```sql
-- شغل هذا في SQL Editor
SELECT create_admin_profile(
  'UUID_FROM_AUTH_USERS'::uuid,
  'الأستاذ عصام عبدالمنعم'
);
```

### 5. إعداد المشروع

1. افتح `js/config.js`
2. استبدل:
   ```javascript
   const SUPABASE_URL = "https://your-project.supabase.co";
   const SUPABASE_ANON_KEY = "your-anon-key-here";
   ```

### 6. تشغيل المشروع

يمكنك استخدام أي web server:

```bash
# Python
python -m http.server 8000

# PHP
php -S localhost:8000

# Node.js (live-server)
npx live-server

# VS Code Extension: Live Server
```

افتح المتصفح على: `http://localhost:8000`

## 📊 قاعدة البيانات

### الجداول الرئيسية

| الجدول                 | الوصف                                     |
| ---------------------- | ----------------------------------------- |
| `profiles`             | ملفات المستخدمين (Admin, Student, Parent) |
| `parent_student_links` | روابط أولياء الأمور بالطلاب               |
| `subjects`             | المواد الدراسية                           |
| `units`                | الوحدات الدراسية                          |
| `lessons`              | الدروس                                    |
| `files`                | الملفات المرفقة                           |
| `question_bank`        | بنك الأسئلة                               |
| `exams`                | الاختبارات                                |
| `exam_questions`       | أسئلة الاختبار                            |
| `exam_attempts`        | محاولات الطلاب                            |

### تصحيح الاختبارات

التصحيح يتم **server-side** عبر PostgreSQL Function:

```sql
SELECT auto_grade_attempt('attempt-uuid');
```

يتم التصحيح تلقائياً عند:

- تسليم الطالب للاختبار
- تحديث `submitted_at` timestamp

## 🔒 الأمان

### Row Level Security (RLS)

جميع الجداول محمية بـ RLS:

- ✅ Admin: وصول كامل
- ✅ Student: قراءة محتوى صفهم فقط
- ✅ Parent: قراءة نتائج أبنائهم فقط
- ✅ لا يمكن للطلاب أو أولياء الأمور تعديل البيانات

### رفع الملفات

- ✅ Admin فقط يمكنه رفع الملفات
- ✅ حد أقصى 50 ميجابايت للملف
- ✅ أنواع مسموحة: PDF, Images (JPEG, PNG, WebP)
- ✅ الفيديوهات عبر YouTube فقط

### Anti-Cheating في الاختبارات

- ✅ مراقبة تبديل التبويبات (Visibility API)
- ✅ توقيت server-side
- ✅ تصحيح server-side (لا يمكن التلاعب من المتصفح)
- ✅ حفظ عدد المحاولات

## 🎨 المميزات

### RTL Support (كامل)

- ✅ اتجاه من اليمين لليسار
- ✅ خطوط عربية (Cairo من Google Fonts)
- ✅ جميع النصوص بالعربية

### Light/Dark Mode

- ✅ تبديل بين الوضع الليلي والنهاري
- ✅ الحفظ في LocalStorage

### Responsive Design

- ✅ متوافق مع الجوال
- ✅ متوافق مع التابلت
- ✅ متوافق مع سطح المكتب

### Accessibility (A11y)

- ✅ Keyboard Navigation
- ✅ ARIA Labels
- ✅ Screen Reader Support
- ✅ تباين ألوان WCAG AA

### Performance

- ✅ Pagination (20 عنصر في الصفحة)
- ✅ Lazy Loading للصور
- ✅ Caching في LocalStorage
- ✅ Indexes محسّنة للأداء

## 📝 الاستخدام

### تسجيل طالب جديد

1. اذهب إلى `/register-student.html`
2. أدخل:
   - الاسم الكامل
   - البريد الإلكتروني
   - كلمة المرور
   - الصف الدراسي (5-12)
3. سجل الدخول من `/login.html`

### تسجيل ولي أمر

1. اذهب إلى `/register-parent.html`
2. أدخل:
   - الاسم الكامل
   - البريد الإلكتروني
   - كلمة المرور
3. بعد تسجيل الدخول، اربط حساب الطالب

### إنشاء اختبار (Admin)

1. أنشئ أسئلة في بنك الأسئلة
2. اذهب إلى "إنشاء اختبار جديد"
3. اختر الصف والمادة
4. أضف الأسئلة من البنك
5. حدد:
   - المدة الزمنية
   - عدد المحاولات
   - Shuffle الأسئلة/الخيارات
6. انشر الاختبار

### إجراء اختبار (Student)

1. اذهب إلى "الاختبارات المتاحة"
2. اضغط "ابدأ الاختبار"
3. أجب على الأسئلة
4. سلّم الاختبار
5. شاهد النتيجة فوراً (إذا كانت متاحة)

## 🛠️ التطوير

### إضافة صفحة جديدة

1. أنشئ ملف HTML في المجلد المناسب
2. أضف الـ CSS المطلوبة
3. استورد السكريبتات الأساسية:
   ```html
   <script src="/js/config.js"></script>
   <script src="/js/utils/errors.js"></script>
   <script src="/js/services/auth.service.js"></script>
   ```
4. أضف route guard:
   ```javascript
   authService.requireRole("admin"); // أو 'student' أو 'parent'
   ```

### إضافة Service جديد

1. أنشئ ملف في `js/services/`
2. استخدم نمط Class:
   ```javascript
   class MyService {
     async myMethod() {
       try {
         const { data, error } = await supabase...
         if (error) throw error;
         return data;
       } catch (error) {
        handleError(error, 'myMethod');
         throw error;
       }
     }
   }
   window.myService = new MyService();
   ```

## 🚨 استكشاف الأخطاء

### خطأ "PGRST116" (Permission Denied)

- تأكد من تطبيق RLS Policies بشكل صحيح
- تحقق من role المستخدم
- راجع policies في `supabase/migrations/0004_rls_policies.sql`

### لا يمكن رفع الملفات

- تأكد من إنشاء Storage Bucket: `lesson-files`
- تأكد من أن المستخدم Admin
- تحقق من حجم الملف (< 50 MB)

### تسجيل الدخول لا يعمل

- تحقق من `SUPABASE_URL` و `SUPABASE_ANON_KEY` في `js/config.js`
- تأكد من وجود profile للمستخدم في جدول `profiles`

## 📦 النشر (Deployment)

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

### Cloudflare Pages

1. ارفع المشروع إلى GitHub
2. اربط Cloudflare Pages بالـ Repo
3. Deploy تلقائياً

## 📚 الوثائق الإضافية

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## 🤝 المساهمة

هذا مشروع تعليمي خاص. للاستفسارات، يرجى التواصل مع الأستاذ عصام عبدالمنعم.

## 📄 الترخيص

جميع الحقوق محفوظة © 2026 الأستاذ عصام عبدالمنعم

---

**بني بـ ❤️ باستخدام HTML + CSS + JavaScript + Supabase**
