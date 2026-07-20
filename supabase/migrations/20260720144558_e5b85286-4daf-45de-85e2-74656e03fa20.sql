
-- Replace SECURITY DEFINER RPC with column-scoped UPDATE for click counting
DROP FUNCTION IF EXISTS public.increment_link_click(uuid);

CREATE POLICY "Public can increment link click count"
  ON public.link_tracking FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

-- Restrict UPDATE to the click_count column only for public roles
REVOKE UPDATE ON public.link_tracking FROM anon, authenticated;
GRANT UPDATE (click_count, updated_at) ON public.link_tracking TO anon, authenticated;
GRANT ALL ON public.link_tracking TO service_role;
