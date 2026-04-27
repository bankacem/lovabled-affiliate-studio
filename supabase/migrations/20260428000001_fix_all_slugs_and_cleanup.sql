
-- 1. Function to generate slugs in PostgreSQL matching JS logic (including Arabic support)
CREATE OR REPLACE FUNCTION generate_seo_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  IF title IS NULL THEN
    RETURN NULL;
  END IF;

  slug := LOWER(TRIM(title));

  -- Replace Arabic/Persian numbers with English
  slug := TRANSLATE(slug, '٠١٢٣٤٥٦٧٨٩', '0123456789');

  -- Replace spaces, underscores, dots and other separators with hyphens
  slug := REGEXP_REPLACE(slug, '[\s._]+', '-', 'g');

  -- Remove special characters except alphanumeric, hyphens, and Arabic characters
  -- Arabic block: \u0600-\u06FF -> [\u0600-\u06FF] in regex
  -- PostgreSQL uses different syntax for Unicode blocks, but we can use ranges if the database encoding is UTF8.
  -- whitelisting a-z, 0-9, hyphen and the Arabic block.
  slug := REGEXP_REPLACE(slug, '[^a-z0-9\-آأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىي]', '', 'g');

  -- Remove consecutive hyphens
  slug := REGEXP_REPLACE(slug, '-+', '-', 'g');

  -- Remove leading and trailing hyphens
  slug := REGEXP_REPLACE(slug, '^-+|-+$', '', 'g');

  -- Truncate to 200 chars
  slug := LEFT(slug, 200);

  -- Remove trailing hyphen if truncated mid-word
  slug := REGEXP_REPLACE(slug, '-+$', '');

  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- 2. Delete the problematic post
DELETE FROM blog_posts
WHERE title LIKE '%لدي مشكل المقالات لا تضهر%'
   OR content LIKE '%لدي مشكل المقالات لا تضهر%';

-- 3. Update existing blog post slugs
UPDATE blog_posts
SET slug = generate_seo_slug(title)
WHERE source != 'programmatic' OR source IS NULL;

-- 4. Update programmatic posts (preserving the 'p-' prefix)
UPDATE blog_posts
SET slug = 'p-' || generate_seo_slug(REPLACE(slug, 'p-', ''))
WHERE source = 'programmatic';

-- 5. Update designs slugs if missing or using UUIDs
UPDATE designs
SET slug = generate_seo_slug(name)
WHERE slug IS NULL OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Clean up
DROP FUNCTION generate_seo_slug(TEXT);
