
-- Enable RLS on tables that had policies but RLS disabled
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Remove overly-permissive duplicate public-read on blog_posts (published-only remains)
DROP POLICY IF EXISTS "Allow public read access" ON public.blog_posts;

-- Replace overly-permissive INSERT/UPDATE (WITH CHECK true / USING true) with constrained rules
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Public can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (
    page_path IS NOT NULL
    AND length(page_path) <= 2048
    AND (user_agent IS NULL OR length(user_agent) <= 1024)
    AND (referrer IS NULL OR length(referrer) <= 2048)
  );

DROP POLICY IF EXISTS "Anyone can insert link clicks" ON public.link_tracking;
CREATE POLICY "Public can insert link clicks"
  ON public.link_tracking FOR INSERT
  WITH CHECK (
    target_url IS NOT NULL
    AND length(target_url) <= 2048
    AND link_type IN ('internal','external')
  );

-- Remove the always-true public UPDATE on link_tracking; use a SECURITY DEFINER RPC for click increments
DROP POLICY IF EXISTS "Anyone can update link clicks" ON public.link_tracking;

CREATE OR REPLACE FUNCTION public.increment_link_click(_link_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.link_tracking
     SET click_count = click_count + 1,
         updated_at = now()
   WHERE id = _link_id;
$$;

-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only what's needed
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_link_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_link_click(uuid) TO anon, authenticated;

-- Ensure Data API grants for the RLS-enabled tables
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

GRANT SELECT ON public.designs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.designs TO authenticated;
GRANT ALL ON public.designs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
