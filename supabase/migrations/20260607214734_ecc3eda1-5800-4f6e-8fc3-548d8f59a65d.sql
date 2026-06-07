REVOKE ALL ON public.user_roles FROM anon, PUBLIC;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
CREATE POLICY "Deny anonymous access to user_roles" ON public.user_roles AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);