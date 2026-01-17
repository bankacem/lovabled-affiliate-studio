-- Create table for tracking page views and analytics
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking internal and external links
CREATE TABLE public.link_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  link_text TEXT,
  link_type TEXT NOT NULL DEFAULT 'external', -- 'internal' or 'external'
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for auto-linking keywords to posts
CREATE TABLE public.auto_link_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  target_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(keyword, target_post_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_link_keywords ENABLE ROW LEVEL SECURITY;

-- Page views policies - anyone can insert (for tracking), admins can view all
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all page views" 
ON public.page_views 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Link tracking policies
CREATE POLICY "Anyone can insert link clicks" 
ON public.link_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update link clicks" 
ON public.link_tracking 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can view link tracking" 
ON public.link_tracking 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto link keywords policies
CREATE POLICY "Admins can manage auto link keywords" 
ON public.auto_link_keywords 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active keywords" 
ON public.auto_link_keywords 
FOR SELECT 
USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX idx_page_views_post_id ON public.page_views(post_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_link_tracking_source_post ON public.link_tracking(source_post_id);
CREATE INDEX idx_link_tracking_type ON public.link_tracking(link_type);
CREATE INDEX idx_auto_link_keyword ON public.auto_link_keywords(keyword);

-- Add view_count column to blog_posts for caching
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;