-- ================================================================
-- FIX FINAL: تفعيل pg_trgm + indexes للـ slugs
-- ================================================================

-- 1. تفعيل extension للـ fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Index عادي على slug (للـ exact match)
CREATE INDEX IF NOT EXISTS idx_bp_slug_exact
ON public.blog_posts(slug);

-- 3. Index للـ ILIKE search (Phase 4 في الكود)
CREATE INDEX IF NOT EXISTS idx_bp_slug_trgm
ON public.blog_posts USING gin(slug gin_trgm_ops);

-- 4. تأكد أن المقالات published
SELECT status, COUNT(*) FROM blog_posts GROUP BY status;

-- 5. اعرض أول slug من DB للتأكد
SELECT slug FROM blog_posts
WHERE status = 'published'
ORDER BY published_at DESC
LIMIT 3;
