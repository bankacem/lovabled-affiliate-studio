-- 1. إصلاح RLS
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Allow public read access for user_roles"
ON public.user_roles FOR SELECT TO authenticated USING (true);

-- 2. منح صلاحية Admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@aiprintverse.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. إضافة عمود video_url
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- 4. تحديث قيود الحالة
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_status_check
CHECK (status IN ('draft', 'published', 'archived', 'scheduled', 'generated_draft'));

-- 5. إنشاء دالة RPC
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
