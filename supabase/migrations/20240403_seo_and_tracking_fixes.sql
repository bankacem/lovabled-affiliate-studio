
-- 1. Normalize Blog Slugs
-- Convert all slugs to lowercase and replace underscores/spaces with hyphens
UPDATE public.blog_posts
SET slug = lower(trim(regexp_replace(slug, '[\s_]+', '-', 'g')));

-- Add UNIQUE INDEX to prevent duplicate slugs
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts (slug);

-- 2. View Count Tracking (M-08)
-- Implement an RPC function to increment view count safely (avoids race conditions)
CREATE OR REPLACE FUNCTION public.increment_view_count(post_slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Normalize Design Slugs (Ensuring consistency with T-01)
UPDATE public.designs
SET slug = lower(trim(regexp_replace(slug, '[\s_]+', '-', 'g')))
WHERE slug IS NOT NULL;
