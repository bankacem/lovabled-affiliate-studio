-- Add keywords column to blog_posts if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'keywords'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN keywords TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Add scheduled_publish_at column for scheduling
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'scheduled_publish_at'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN scheduled_publish_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add amazon_url and etsy_url to designs table
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'designs' 
        AND column_name = 'amazon_url'
    ) THEN
        ALTER TABLE public.designs ADD COLUMN amazon_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'designs' 
        AND column_name = 'etsy_url'
    ) THEN
        ALTER TABLE public.designs ADD COLUMN etsy_url TEXT;
    END IF;
END $$;