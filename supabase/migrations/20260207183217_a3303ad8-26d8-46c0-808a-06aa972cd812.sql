-- Add impressions column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0;

-- Add clicks column for CTR calculation
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0;

-- Add index for faster sorting by impressions
CREATE INDEX IF NOT EXISTS idx_blog_posts_impressions ON public.blog_posts(impressions DESC);