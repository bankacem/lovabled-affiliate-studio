-- Create slugify function
CREATE OR REPLACE FUNCTION slugify(v_text TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(both '-' from regexp_replace(regexp_replace(v_text, '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')));
END;
$$ LANGUAGE plpgsql;

-- Add slug column
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS slug TEXT;

-- Populate slug column
UPDATE public.designs SET slug = slugify(name) WHERE slug IS NULL;

-- Handle potential duplicates (very basic approach: append last 4 chars of UUID)
UPDATE public.designs d1
SET slug = slug || '-' || substring(id::text from 1 for 4)
WHERE EXISTS (
  SELECT 1 FROM public.designs d2
  WHERE d1.slug = d2.slug AND d1.id <> d2.id
);

-- Make slug NOT NULL and UNIQUE
ALTER TABLE public.designs ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.designs ADD CONSTRAINT designs_slug_unique UNIQUE (slug);

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_designs_slug ON public.designs(slug);
