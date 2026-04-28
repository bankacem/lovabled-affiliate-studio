-- ================================================================
-- الإصلاح النهائي الكامل دفعة واحدة
-- ================================================================

-- 1. تشخيص أولاً
SELECT status, COUNT(*) FROM blog_posts GROUP BY status;

-- 2. اعرض RLS الحالية
SELECT policyname, cmd, roles::text
FROM pg_policies WHERE tablename = 'blog_posts';

-- 3. احذف كل policies قديمة
DROP POLICY IF EXISTS "anon_read_published"     ON public.blog_posts;
DROP POLICY IF EXISTS "auth_read_all_posts"     ON public.blog_posts;
DROP POLICY IF EXISTS "auth_insert_posts"       ON public.blog_posts;
DROP POLICY IF EXISTS "auth_update_posts"       ON public.blog_posts;
DROP POLICY IF EXISTS "auth_delete_posts"       ON public.blog_posts;
DROP POLICY IF EXISTS "Public read published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin full access to blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow read access" ON public.blog_posts;

-- 4. أضف policies نظيفة
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- الزوار يقرؤون المقالات المنشورة
CREATE POLICY "public_read_published"
ON public.blog_posts FOR SELECT TO anon
USING (status = 'published');

-- المستخدمين المسجلين يقرؤون كل شيء
CREATE POLICY "auth_read_all"
ON public.blog_posts FOR SELECT TO authenticated
USING (true);

-- المستخدمين المسجلين يكتبون ويعدلون ويحذفون
CREATE POLICY "auth_write"
ON public.blog_posts FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 5. اختبر مباشرة كـ anon
SET LOCAL ROLE anon;
SELECT COUNT(*) as "مقالات مرئية للزوار" FROM blog_posts WHERE status = 'published';
RESET ROLE;

-- 6. تأكد من النتيجة
SELECT status, COUNT(*) FROM blog_posts GROUP BY status;
