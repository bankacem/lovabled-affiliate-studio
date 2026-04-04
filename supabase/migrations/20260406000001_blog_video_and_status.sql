-- =============================================================
-- Migration: Add video_url column + fix status CHECK constraint
-- Date: 2026-04-02
-- Reason:
--   1. BlogPostEditor uses video_url field but column didn't exist
--   2. BlogPostEditor saves status='scheduled' but old CHECK constraint
--      only allowed: draft | published | archived -> caused silent save failures
-- =============================================================

-- Step 1: Add video_url column to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- Step 2: Drop old status CHECK constraint (doesn't include 'scheduled')
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_status_check;

-- Step 3: Add new CHECK constraint that includes 'scheduled'
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft', 'published', 'archived', 'scheduled', 'generated_draft'));

-- Step 4: Add index on video_url for potential future queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_video_url
  ON public.blog_posts(video_url)
  WHERE video_url IS NOT NULL;

-- Step 5: Update fetch function to also handle 'scheduled' posts for admins
-- (No SQL needed — this is handled at the application layer via RLS policies)

COMMENT ON COLUMN public.blog_posts.video_url IS
  'Optional YouTube video URL embedded in the blog post body';

COMMENT ON COLUMN public.blog_posts.status IS
  'Post lifecycle status: draft | scheduled | published | archived | generated_draft';
