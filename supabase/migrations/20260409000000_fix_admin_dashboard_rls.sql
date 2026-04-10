-- ================================================================
-- FIX: اجعل كل البيانات تظهر في Admin Dashboard
-- ================================================================

-- 1. السماح للـ admin بقراءة كل المقالات
DROP POLICY IF EXISTS "Admin full access to blog_posts" ON public.blog_posts;
CREATE POLICY "Admin full access to blog_posts"
ON public.blog_posts FOR SELECT TO authenticated
USING (true);

-- 2. السماح للـ admin بقراءة كل التصاميم
DROP POLICY IF EXISTS "Admin full access to designs" ON public.designs;
CREATE POLICY "Admin full access to designs"
ON public.designs FOR SELECT TO authenticated
USING (true);

-- 3. السماح للـ admin بقراءة المتاجر
DROP POLICY IF EXISTS "Admin full access to stores" ON public.stores;
CREATE POLICY "Admin full access to stores"
ON public.stores FOR SELECT TO authenticated
USING (true);

-- 4. السماح للـ anon بقراءة المقالات المنشورة (للزوار)
DROP POLICY IF EXISTS "Public read published posts" ON public.blog_posts;
CREATE POLICY "Public read published posts"
ON public.blog_posts FOR SELECT TO anon
USING (status = 'published');

-- 5. السماح للـ anon بقراءة التصاميم (للزوار)
DROP POLICY IF EXISTS "Public read designs" ON public.designs;
CREATE POLICY "Public read designs"
ON public.designs FOR SELECT TO anon
USING (true);

-- 6. إصلاح user_roles نهائياً
DROP POLICY IF EXISTS "uroles_own_read"   ON public.user_roles;
DROP POLICY IF EXISTS "uroles_admin_manage" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read access for user_roles" ON public.user_roles;

CREATE POLICY "uroles_own_read"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 7. تأكيد admin للبريد الإلكتروني
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'admin@aiprintverse.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. منح صلاحيات القراءة
GRANT SELECT ON public.blog_posts TO authenticated, anon;
GRANT SELECT ON public.designs    TO authenticated, anon;
GRANT SELECT ON public.stores     TO authenticated, anon;
GRANT SELECT ON public.user_roles TO authenticated;
