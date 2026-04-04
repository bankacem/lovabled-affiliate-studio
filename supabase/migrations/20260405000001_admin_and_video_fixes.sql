-- Fix 5: Add video_url and update status constraint for blog_posts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'video_url') THEN
        ALTER TABLE public.blog_posts ADD COLUMN video_url TEXT;
    END IF;
END $$;

-- Update status check constraint to include 'scheduled'
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check
CHECK (status IN ('draft', 'published', 'scheduled', 'archived'));

-- Fix 9: RLS policy for user_roles
-- This policy allows authenticated users to read their own role,
-- which is necessary to prevent the "Access Denied" race condition/circular dependency.
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
