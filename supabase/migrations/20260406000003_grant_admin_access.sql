-- =============================================================
-- Migration: Grant admin role to specific email address
-- Date: 2026-04-03
-- Purpose: Fix "Access Denied" for admin@aiprintverse.com
-- =============================================================

-- This migration inserts the admin role for the user whose email
-- is admin@aiprintverse.com, using a lookup from auth.users.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Look up the user ID by email from the auth schema
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'admin@aiprintverse.com'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User admin@aiprintverse.com not found in auth.users. Create the account first.';
  ELSE
    -- Insert admin role (safe duplicate handling)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role granted to user: %', target_user_id;
  END IF;
END $$;

-- Also confirm the RLS policy allows users to read their own role
-- (idempotent - safe to run even if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles'
      AND policyname = 'Users can view own role'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view own role"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id)
    $policy$;
    RAISE NOTICE 'Created "Users can view own role" policy';
  ELSE
    RAISE NOTICE '"Users can view own role" policy already exists';
  END IF;
END $$;
