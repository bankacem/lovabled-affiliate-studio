-- Final database optimization for blog post slugs
-- Ensures high-performance lookups for both exact and fuzzy matches

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Exact match index
CREATE INDEX IF NOT EXISTS idx_bp_slug_exact
ON public.blog_posts(slug);

-- Trigram index for ILIKE fuzzy search
CREATE INDEX IF NOT EXISTS idx_bp_slug_trgm
ON public.blog_posts USING gin(slug gin_trgm_ops);
