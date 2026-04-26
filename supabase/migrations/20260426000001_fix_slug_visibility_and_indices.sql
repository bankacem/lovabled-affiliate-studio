-- ================================================================
-- FIX COMPLETE: Final fix for article visibility and indexing
-- ================================================================

-- 1. Enable pg_trgm extension (for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Ensure slug index exists
CREATE INDEX IF NOT EXISTS idx_bp_slug_exact
ON public.blog_posts(slug);

-- 3. Add index for ILIKE search (fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_bp_slug_trgm
ON public.blog_posts USING gin(slug gin_trgm_ops);

-- 4. Ensure all articles have status = 'published' if it was missing
-- (Makes all imported/generated articles visible)
UPDATE blog_posts
SET status = 'published'
WHERE status IS NULL OR status = '' OR status = 'generated_draft';

-- 5. Verification summary (visible in logs during migration)
DO $$
DECLARE
    total_count INTEGER;
    published_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM blog_posts;
    SELECT COUNT(*) INTO published_count FROM blog_posts WHERE status = 'published';
    RAISE NOTICE 'Migration Complete: % total posts, % published.', total_count, published_count;
END $$;
