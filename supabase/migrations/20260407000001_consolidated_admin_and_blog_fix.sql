-- ================================================================
-- الخطوة الوحيدة المطلوبة لحل مشكلة الدخول للوحة الإدارة
-- ================================================================
-- كيفية التشغيل:
-- 1. اذهب للرابط: https://supabase.com/dashboard
-- 2. اختر مشروعك
-- 3. في القائمة اليسرى اضغط "SQL Editor"
-- 4. اضغط "New Query"
-- 5. انسخ كل هذا الكود والصقه
-- 6. اضغط "Run"
-- ================================================================

-- الخطوة 1: منح صلاحية admin للمستخدم admin@aiprintverse.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@aiprintverse.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- الخطوة 2: إصلاح مشكلة RLS (كانت تمنع قراءة الصلاحيات)
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- الخطوة 3: إضافة video_url لجدول blog_posts (لو لم يكن موجوداً)
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- الخطوة 4: تحديث قيود status لتشمل 'scheduled'
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_status_check;

ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_status_check
CHECK (status IN ('draft', 'published', 'archived', 'scheduled', 'generated_draft'));

-- ================================================================
-- بعد تشغيل هذا الكود:
-- ارجع للموقع واضغط Sign In مرة أخرى بنفس الإيميل وكلمة السر
-- يجب أن تفتح لوحة التحكم مباشرة
-- ================================================================
