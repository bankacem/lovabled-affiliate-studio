
-- 1. Add slug column to designs table
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create a function to generate SEO-friendly slugs
CREATE OR REPLACE FUNCTION public.generate_seo_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    -- Convert to lowercase
    slug := lower(title);
    -- Remove special characters
    slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
    -- Replace spaces and underscores with hyphens
    slug := regexp_replace(slug, '[\s_]+', '-', 'g');
    -- Remove consecutive hyphens
    slug := regexp_replace(slug, '-+', '-', 'g');
    -- Remove leading and trailing hyphens
    slug := trim(both '-' from slug);
    -- Limit length
    slug := left(slug, 100);
    -- Ensure it doesn't end with a hyphen
    slug := regexp_replace(slug, '-+$', '');
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Update existing designs with slugs
-- We use a combination of category and name to ensure uniqueness and keyword density
UPDATE public.designs
SET slug = public.generate_seo_slug(COALESCE(category, 'design') || '-' || COALESCE(name, id::text))
WHERE slug IS NULL;

-- 4. Handle any duplicate slugs by appending the ID
UPDATE public.designs d1
SET slug = slug || '-' || left(id::text, 8)
WHERE EXISTS (
    SELECT 1 FROM public.designs d2
    WHERE d1.slug = d2.slug AND d1.id != d2.id
);

-- 5. Make slug NOT NULL and UNIQUE
ALTER TABLE public.designs ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.designs ADD CONSTRAINT designs_slug_unique UNIQUE (slug);

-- 6. Add a trigger to automatically generate slug on insert if not provided
CREATE OR REPLACE FUNCTION public.trg_generate_design_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_seo_slug(COALESCE(NEW.category, 'design') || '-' || COALESCE(NEW.name, NEW.id::text));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_designs_generate_slug
    BEFORE INSERT ON public.designs
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_generate_design_slug();
