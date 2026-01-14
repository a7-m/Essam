# 🚀 Quick Start Guide

## ابدأ في 5 دقائق!

---

## المتطلبات

- ✅ متصفح حديث (Chrome, Firefox, Safari, Edge)
- ✅ حساب Supabase (مجاني)
- ✅ Web server بسيط (Python, PHP, أو Live Server)

---

## الخطوات السريعة

### 1️⃣ إنشاء Supabase Project (دقيقتان)

1. اذهب إلى [supabase.com](https://supabase.com) وسجل الدخول
2. اضغط **"New Project"**
3. املأ:
   - Name: `esam-platform`
   - Database Password: [احتفظ به]
   - Region: اختر أقرب منطقة
4. انتظر حتى يصبح جاهز

### 2️⃣ نسخ Credentials (30 ثانية)

1. من Project Settings → API
2. انسخ:
   - **Project URL**
   - **anon/public key**
3. افتح `js/config.js` والصق القيم:
   ```javascript
   const SUPABASE_URL = "https://xxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGc...";
   ```

### 3️⃣ تشغيل Database Migrations (دقيقة واحدة)

1. في Supabase Dashboard، اذهب إلى **SQL Editor**
2. انسخ والصق المحتوى **بالترتيب**:
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_quiz_system.sql`
   - `supabase/migrations/0003_indexes.sql`
   - `supabase/migrations/0004_rls_policies.sql`
3. اضغط **RUN** لكل ملف

### 4️⃣ إنشاء Storage Bucket (15 ثانية)

1. اذهب إلى **Storage**
2. اضغط **"New Bucket"**
3. Name: `lesson-files`
4. Public: **✗ (لا تفعّله)**
5. اضغط **"Create"**

### 5️⃣ إنشاء Admin Account (30 ثانية)

1. اذهب إلى **Authentication** → **Users** → **"Add User"**
2. Email: `admin@example.com`
3. Password: [كلمة مرور قوية]
4. ✓ Auto Confirm User
5. اضغط **"Create"** وانسخ الـ UUID

6. في **SQL Editor**، شغّل:
   ```sql
   INSERT INTO profiles (id, full_name, role)
   VALUES ('UUID_هنا'::uuid, 'الأستاذ عصام عبدالمنعم', 'admin');
   ```

### 6️⃣ تشغيل المشروع (20 ثانية)

اختر طريقة:

**Python:**

```bash
cd "C:\Users\win 11\Desktop\Esam"
python -m http.server 8000
```

**PHP:**

```bash
php -S localhost:8000
```

**Live Server (VS Code):**

```
افتح المشروع في VS Code
→ Right click على index.html
→ "Open with Live Server"
```

### 7️⃣ افتح المتصفح

```
http://localhost:8000
```

---

## ✅ اختبر النظام

1. **Landing Page**: يجب أن تظهر الصفحة الرئيسية
2. **اضغط "تسجيل الدخول"**
3. **سجل الدخول بـ:**
   - Email: `admin@example.com`
   - Password: [كلمة المرور]
4. **يجب أن يتم تحويلك إلى:** `/admin/dashboard.html`

---

## ❗ استكشاف الأخطاء السريع

### المشكلة: "Failed to fetch"

**الحل:** تحقق من قيم `SUPABASE_URL` و `SUPABASE_ANON_KEY` في `js/config.js`

### المشكلة: "relation does not exist"

**الحل:** لم تشغل Migrations. راجع الخطوة 3

### المشكلة: لا يمكن تسجيل الدخول

**الحل:** لم تنشئ profile للـ admin. راجع الخطوة 5

### المشكلة: Dashboard فارغة

**الحل:** Admin Dashboard لم يتم إنشاؤها بعد (Phase 3)

---

## 📚 المراجع

- [SETUP.md](SETUP.md) - دليل تفصيلي خطوة بخطوة
- [README.md](README.md) - وثائق كاملة
- [ARCHITECTURE.md](ARCHITECTURE.md) - معمارية النظام

---

## 🎯 الخطوات التالية

بعد تسجيل الدخول كـ Admin، المطلوب:

1. ✅ إنشاء صفحات Admin Dashboard (Phase 3)
2. ✅ إنشاء صفحات Student Registration & Portal (Phase 4)
3. ✅ إنشاء صفحات Parent Registration & Portal (Phase 5)
4. ✅ تطوير Quiz Engine (Phase 6)

---

**مبروك! 🎉 البنية التحتية جاهزة والنظام يعمل!**

**Ready to build amazing educational experiences! 🚀**
