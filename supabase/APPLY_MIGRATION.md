# تعليمات تطبيق التحديثات

## الخطوة 1: تطبيق Migration في Supabase

يجب تطبيق ملف الـ migration الجديد في قاعدة البيانات:

### الطريقة الأولى: عبر Supabase Dashboard (موصى بها)

1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **SQL Editor** من القائمة الجانبية
4. انقر على **New Query**
5. انسخ محتوى الملف [`0005_fix_profile_creation.sql`](file:///c:/Users/win%2011/Desktop/Esam/supabase/migrations/0005_fix_profile_creation.sql)
6. الصق المحتوى في محرر SQL
7. انقر على **Run** لتنفيذ الـ migration

### الطريقة الثانية: عبر Supabase CLI

إذا كان لديك Supabase CLI مثبت:

```bash
# من مجلد المشروع
supabase db push
```

## الخطوة 2: التحقق من التطبيق

بعد تطبيق الـ migration، تحقق من:

1. **الـ Trigger تم إنشاؤه**:

   - اذهب إلى **Database** → **Triggers**
   - يجب أن ترى trigger باسم `on_auth_user_created`

2. **الـ Function موجودة**:

   - اذهب إلى **Database** → **Functions**
   - يجب أن ترى function باسم `handle_new_user`

3. **الـ Policy تمت إضافتها**:
   - اذهب إلى **Authentication** → **Policies**
   - اختر جدول `profiles`
   - يجب أن ترى policy باسم `user_insert_own_profile`

## الخطوة 3: اختبار التسجيل

1. افتح صفحة التسجيل: `http://localhost:5500/register-student.html`
2. املأ النموذج ببيانات طالب جديد
3. انقر على "إنشاء الحساب"
4. يجب أن يتم التسجيل بنجاح دون أخطاء

## الخطوة 4: التحقق من إنشاء الملف الشخصي

في Supabase Dashboard:

1. اذهب إلى **Table Editor**
2. اختر جدول `profiles`
3. يجب أن ترى الملف الشخصي الجديد للمستخدم الذي سجلته

---

## ملاحظات مهمة

> [!IMPORTANT]
>
> - يجب تطبيق الـ migration قبل اختبار التسجيل
> - الـ Trigger سيعمل تلقائياً لكل مستخدم جديد
> - إذا فشل الـ Trigger، هناك policy احتياطية تسمح بإنشاء الملف يدوياً

> [!TIP]
> إذا واجهت مشاكل، تحقق من:
>
> - أن الـ migration تم تطبيقه بنجاح
> - أن البيانات المدخلة صحيحة (البريد الإلكتروني، كلمة المرور، الصف الدراسي)
> - سجلات الأخطاء في console المتصفح
