-- ============================================================
-- DATABASE VERIFICATION SCRIPT (Project: krugmbovsjjgjikgzacl)
-- ============================================================

-- 1. Verify table exists and has critical columns (including video_url)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'blog_posts'
AND column_name IN ('id', 'slug', 'status', 'video_url', 'created_at', 'author_name');

-- 2. Check content distribution by status
-- This helps verify if 'published' posts are available for the frontend
SELECT status, COUNT(*) as post_count
FROM public.blog_posts
GROUP BY status;

-- 3. Verify RLS (Row Level Security) policies
-- Essential for ensuring 'anon' users can see published posts
SELECT policyname, cmd, roles, USING_expression
FROM pg_policies
WHERE tablename = 'blog_posts';

-- 4. Sample latest articles
-- Confirms that the data in this project ID is up-to-date
SELECT title, slug, status, created_at
FROM public.blog_posts
ORDER BY created_at DESC
LIMIT 5;
