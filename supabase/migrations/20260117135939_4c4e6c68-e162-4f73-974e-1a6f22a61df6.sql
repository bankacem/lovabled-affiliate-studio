-- Drop the existing check constraint on status
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;

-- Add new check constraint that includes 'scheduled' status
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check 
CHECK (status IN ('draft', 'published', 'scheduled'));