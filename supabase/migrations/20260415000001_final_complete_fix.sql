-- ================================================================
-- FINAL COMPLETE FIX — Run this in Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New Query → paste → Run
-- ================================================================

-- ── 1. Enable RLS ────────────────────────────────────────────────
ALTER TABLE public.blog_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles   ENABLE ROW LEVEL SECURITY;

-- ── 2. blog_posts: clear all old policies ────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'blog_posts'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.blog_posts'; END LOOP;
END $$;

-- Public (anon) can read published articles
CREATE POLICY "anon_read_published"
  ON public.blog_posts FOR SELECT TO anon
  USING (status = 'published');

-- Authenticated users (admin) can read ALL articles (draft, published, scheduled…)
CREATE POLICY "auth_read_all"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (true);

-- Authenticated can insert / update / delete
CREATE POLICY "auth_insert"  ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update"  ON public.blog_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete"  ON public.blog_posts FOR DELETE TO authenticated USING (true);

-- ── 3. designs ───────────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'designs'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.designs'; END LOOP;
END $$;

CREATE POLICY "anon_read_designs"  ON public.designs FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_all_designs"   ON public.designs FOR ALL    TO authenticated  USING (true) WITH CHECK (true);

-- ── 4. stores ────────────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'stores'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.stores'; END LOOP;
END $$;

CREATE POLICY "auth_all_stores" ON public.stores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 5. user_roles: clear and recreate ────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_roles'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_roles'; END LOOP;
END $$;

-- Each user can read and insert their own role
CREATE POLICY "self_read_role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "self_insert_role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── 6. has_role function ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, anon;

-- ── 7. Grant admin to admin@aiprintverse.com ─────────────────────
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = 'admin@aiprintverse.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Create it first: Supabase Auth → Users → Add User';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Admin role granted to: %', v_user_id;
  END IF;
END $$;

-- ── 8. video_url column (if missing) ─────────────────────────────
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- ── 9. Fix status constraint to include scheduled ────────────────
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft','published','archived','scheduled','generated_draft'));

-- ── 10. GRANT direct table access ────────────────────────────────
GRANT SELECT                       ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT                       ON public.designs    TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.designs    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores     TO authenticated;
GRANT SELECT, INSERT               ON public.user_roles  TO authenticated;

-- ── Done ─────────────────────────────────────────────────────────
-- After running: go to /admin, sign in, dashboard should open.
-- Articles at /blog should now show all published posts.
