-- =============================================================
-- HOW TO CREATE YOUR FIRST ADMIN USER
-- Run this AFTER creating the user via Supabase Auth dashboard
-- or via email invitation.
-- =============================================================

-- Step 1: Go to Supabase Dashboard > Authentication > Users
-- Step 2: Click "Invite User" and enter the admin email
-- Step 3: After the user confirms their email, get their UUID
--         (shown in the Users list)
-- Step 4: Run the INSERT below replacing 'YOUR-USER-UUID-HERE'

-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR-USER-UUID-HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================================
-- RLS Policy fix: Allow users to READ their own role
-- (Without this, checkAdminRole fallback query returns empty)
-- =============================================================

-- Drop existing overly-restrictive policy if it exists
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Allow admins to see ALL roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- FIX: Allow every authenticated user to read THEIR OWN role
-- Without this, the fallback query in checkAdminRole always returns null
-- causing legitimate admins to be denied access
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to insert/update/delete roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
