-- Create designs table for storing imported designs
CREATE TABLE public.designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'T-Shirts',
  tags TEXT[] DEFAULT '{}',
  teepublic_url TEXT,
  redbubble_url TEXT,
  featured BOOLEAN DEFAULT false,
  source TEXT, -- 'teepublic' or 'redbubble'
  external_id TEXT, -- ID from the source platform
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (designs are public)
CREATE POLICY "Designs are publicly readable"
ON public.designs
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_designs_category ON public.designs(category);
CREATE INDEX idx_designs_featured ON public.designs(featured);
CREATE INDEX idx_designs_source ON public.designs(source);