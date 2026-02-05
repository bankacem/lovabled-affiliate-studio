-- Add indexing_status field to blog_posts for Smart Internal Linking System
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS indexing_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (indexing_status IN ('indexed', 'pending'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_indexing_status ON public.blog_posts(indexing_status);

-- Set existing published posts as 'indexed' by default (you can adjust later)
UPDATE public.blog_posts 
SET indexing_status = 'indexed' 
WHERE status = 'published' AND created_at < NOW() - INTERVAL '7 days';

-- Comment for documentation
COMMENT ON COLUMN public.blog_posts.indexing_status IS 'Tracks if post is indexed by search engines: indexed = established/high-authority, pending = new/needs promotion';