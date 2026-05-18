-- Add source field to distinguish between manual and programmatic content
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Add template_id field for programmatic content to track which template was used
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS template_id text;

-- Add generation_batch field to group programmatically generated articles
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS generation_batch text;

-- Add design_id field for foreign key relationship to designs table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS design_id uuid REFERENCES public.designs(id);

-- Create index for source field for fast filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_source ON public.blog_posts(source);

-- Create index for generation_batch for batch operations
CREATE INDEX IF NOT EXISTS idx_blog_posts_generation_batch ON public.blog_posts(generation_batch);

-- Create index for design_id for efficient joins
CREATE INDEX IF NOT EXISTS idx_blog_posts_design_id ON public.blog_posts(design_id);

-- Update existing posts to be marked as 'manual' (they already default to this)
UPDATE public.blog_posts 
SET source = 'manual' 
WHERE source IS NULL OR source = '';

-- Create article_templates table for storing programmatic SEO templates
CREATE TABLE IF NOT EXISTS public.article_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  template_type text NOT NULL DEFAULT 'birthday', -- birthday, anniversary, profession, location, hobby
  title_template text NOT NULL, -- e.g., "The Ultimate Guide to Vintage [Year] Birthday Shirts"
  slug_template text NOT NULL, -- e.g., "p-vintage-birthday-shirts-[year]-guide"
  content_template text NOT NULL,
  excerpt_template text,
  category text NOT NULL DEFAULT 'General',
  tags text[] DEFAULT '{}',
  meta_title_template text,
  meta_description_template text,
  variables jsonb DEFAULT '{}', -- Store variable definitions
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on article_templates
ALTER TABLE public.article_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for article_templates
CREATE POLICY "Admins can manage article templates"
ON public.article_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active templates"
ON public.article_templates
FOR SELECT
USING (is_active = true);

-- Create generation_batches table for tracking bulk generations
CREATE TABLE IF NOT EXISTS public.generation_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name text NOT NULL,
  template_id uuid REFERENCES public.article_templates(id),
  total_articles integer NOT NULL DEFAULT 0,
  generated_count integer NOT NULL DEFAULT 0,
  published_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, generating, reviewing, published, cancelled
  variables_data jsonb DEFAULT '{}', -- Store the variables used for generation
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on generation_batches
ALTER TABLE public.generation_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for generation_batches
CREATE POLICY "Admins can manage generation batches"
ON public.generation_batches
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policy on blog_posts to handle programmatic content viewing
-- Programmatic posts in 'generated_draft' status should only be visible to admins
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;

CREATE POLICY "Anyone can view published posts"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

-- Create trigger for updating timestamps on article_templates
CREATE TRIGGER update_article_templates_updated_at
BEFORE UPDATE ON public.article_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating timestamps on generation_batches
CREATE TRIGGER update_generation_batches_updated_at
BEFORE UPDATE ON public.generation_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();