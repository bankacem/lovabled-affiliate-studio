-- 1. Normalize all existing blog slugs (lowercase, hyphenated)
UPDATE public.blog_posts
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(slug, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE status = 'published';

-- 2. Add a UNIQUE INDEX to prevent duplicate slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- 3. Add a CHECK constraint to ensure future slugs are 'clean'
-- This regex allows only lowercase letters, numbers, and hyphens.
ALTER TABLE public.blog_posts
ADD CONSTRAINT clean_slug_check
CHECK (slug ~ '^[a-z0-9-]+$');

-- 4. Create the increment_view_count RPC function to avoid race conditions
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant access to the RPC function
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO service_role;
