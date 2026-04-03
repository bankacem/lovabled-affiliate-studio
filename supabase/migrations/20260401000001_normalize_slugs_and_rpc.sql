-- =============================================================
-- Migration: Normalize blog slugs + atomic view count RPC
-- Date: 2026-04-01
-- =============================================================

-- Step 1: Normalize all existing slugs to lowercase-hyphen format
UPDATE blog_posts
SET slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(slug, '[_\s]+', '-', 'g'),
  '-+', '-', 'g'
))
WHERE slug ~ '[A-Z_\s]';

-- Step 2: Add UNIQUE constraint to prevent duplicate slugs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'blog_posts' AND indexname = 'idx_blog_posts_slug_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_blog_posts_slug_unique ON blog_posts(slug);
  END IF;
END $$;

-- Step 3: Add CHECK constraint — enforce slug format on new inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blog_posts_slug_format'
  ) THEN
    ALTER TABLE blog_posts
    ADD CONSTRAINT blog_posts_slug_format
    CHECK (slug ~ '^[a-z0-9][a-z0-9\-]*[a-z0-9]$');
  END IF;
END $$;

-- Step 4: Create atomic increment_view_count RPC
-- This prevents race conditions when multiple users view the same page
CREATE OR REPLACE FUNCTION increment_view_count(post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE blog_posts
  SET
    view_count = COALESCE(view_count, 0) + 1,
    updated_at = NOW()
  WHERE id = post_id
    AND status = 'published';
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION increment_view_count TO anon;
GRANT EXECUTE ON FUNCTION increment_view_count TO authenticated;