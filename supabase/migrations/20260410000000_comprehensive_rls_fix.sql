-- ================================================================
-- FIX COMPLETE: كل البيانات + المقالات + الصفحة العامة
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

-- 1. تفعيل RLS على الجداول
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores     ENABLE ROW LEVEL SECURITY;

-- 2. حذف كل الـ policies القديمة على blog_posts
DROP POLICY IF EXISTS "Admin full access to blog_posts"  ON public.blog_posts;
DROP POLICY IF EXISTS "Public read published posts"      ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read"     ON public.blog_posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow read access"                ON public.blog_posts;

-- 3. السماح للزوار (anon) بقراءة المقالات المنشورة
CREATE POLICY "anon_read_published"
ON public.blog_posts FOR SELECT TO anon
USING (status = 'published');

-- 4. السماح للـ admin (authenticated) بقراءة كل المقالات
CREATE POLICY "auth_read_all_posts"
ON public.blog_posts FOR SELECT TO authenticated
USING (true);

-- 5. السماح للـ authenticated بالكتابة والتعديل والحذف
CREATE POLICY "auth_insert_posts"
ON public.blog_posts FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_posts"
ON public.blog_posts FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_posts"
ON public.blog_posts FOR DELETE TO authenticated
USING (true);

-- 6. حذف policies قديمة على designs
DROP POLICY IF EXISTS "Admin full access to designs" ON public.designs;
DROP POLICY IF EXISTS "Public read designs"          ON public.designs;

-- 7. السماح بقراءة التصاميم للجميع
CREATE POLICY "anon_read_designs"
ON public.designs FOR SELECT TO anon
USING (true);

CREATE POLICY "auth_all_designs"
ON public.designs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 8. إصلاح stores
DROP POLICY IF EXISTS "Admin full access to stores" ON public.stores;

CREATE POLICY "auth_all_stores"
ON public.stores FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 9. إصلاح user_roles
DROP POLICY IF EXISTS "uroles_own_read"                       ON public.user_roles;
DROP POLICY IF EXISTS "uroles_admin_manage"                   ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role"               ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles"              ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read access for user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles"             ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles"               ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_select"                ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all"                  ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role"             ON public.user_roles;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_read_role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "self_insert_role"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 10. إعادة إنشاء has_role بشكل صحيح
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, anon;

-- 11. منح admin لـ admin@aiprintverse.com
DO $$
DECLARE v UUID;
BEGIN
  SELECT id INTO v FROM auth.users
  WHERE email = 'admin@aiprintverse.com' LIMIT 1;
  IF v IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Admin OK: %', v;
  ELSE
    RAISE NOTICE 'المستخدم غير موجود — أنشئه في Auth > Users';
  END IF;
END $$;

-- 12. GRANT مباشر (للأمان المضاعف)
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT ON public.designs    TO anon, authenticated;
GRANT SELECT ON public.stores     TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
