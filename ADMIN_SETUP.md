# دليل إعداد المسؤول (Admin Setup Guide)

هذا الدليل يشرح كيفية إعداد أول حساب مسؤول (Admin) وتشخيص مشاكل الدخول للوحة التحكم.

## 1. إنشاء حساب مستخدم
أولاً، يجب إنشاء حساب مستخدم عادي من خلال واجهة الموقع (إذا كان التسجيل متاحاً) أو من خلال `Supabase Auth`:
1. اذهب إلى `Supabase Dashboard` > `Authentication` > `Users`.
2. اضغط على `Add User` > `Create new user`.
3. أدخل البريد الإلكتروني وكلمة المرور.

## 2. منح صلاحية المسؤول (Admin Role)
بعد إنشاء المستخدم، يجب منحه دور المسؤول في جدول `user_roles`:
1. اذهب إلى `Supabase Dashboard` > `SQL Editor`.
2. قم بتشغيل الاستعلام التالي (استبدل `USER_EMAIL` ببريدك الإلكتروني):

```sql
-- الحصول على معرف المستخدم ومنحه دور المسؤول
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'USER_EMAIL'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 3. إصلاح مشكلة "Access Denied" (RLS Policy)
إذا كنت مسجلاً كمسؤول وتظهر لك رسالة "Access Denied"، فقد يكون السبب هو سياسة الحماية (RLS). تأكد من تشغيل السياسة التالية في `SQL Editor`:

```sql
-- السماح للمستخدمين المسجلين بقراءة دورهم الخاص
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

## 4. تحديثات قاعدة البيانات الضرورية
تأكد من تطبيق آخر التحديثات للأعمدة الجديدة (مثل `video_url` و حالة `scheduled`):

```sql
-- إضافة عمود الفيديو إذا لم يكن موجوداً
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- تحديث قيود الحالة لتشمل 'scheduled'
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check
CHECK (status IN ('draft', 'published', 'scheduled', 'archived'));
```

## 5. تشخيص المشاكل (Troubleshooting)
- **شاشة بيضاء:** تأكد من تعيين `VITE_SUPABASE_URL` و `VITE_SUPABASE_PUBLISHABLE_KEY` في إعدادات البيئة (Environment Variables).
- **لا يمكن الحفظ:** تحقق من صلاحيات الـ `RLS` لجدول `blog_posts` و `designs`. يجب أن تسمح للمسؤولين (Admins) بجميع العمليات (ALL).
