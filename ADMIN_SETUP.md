# Admin Panel Setup Guide

## Why Can't I Access the Admin Panel?

The most common reasons for being stuck at "Access Denied" or the sign-in page:

### 1. No Admin Role in Database (Most Common)

After signing in, the system checks `user_roles` table for `role = 'admin'`.
If no row exists, you see "Access Denied" even with correct credentials.

**Fix:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication > Users** → Find your user → copy the UUID
3. **Table Editor > user_roles** → Insert new row:
   - `user_id`: paste your UUID
   - `role`: `admin`
4. Refresh the admin page

### 2. RLS Policy Blocking Role Lookup

Run this SQL in Supabase SQL Editor if the above doesn't work:

```sql
-- Allow users to read their own role (required for login check)
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 3. Race Condition (Fixed in this version)

Old version: `isLoading` was set to `false` before the admin role check completed,
causing a flash of "Access Denied". This is fixed in `useAuth.ts`.

---

## Running Migrations

After deploying, run all migrations in order:

```bash
supabase db push
```

Or manually in SQL Editor in chronological order (by filename date prefix).

---

## Creating Admin Users

Do NOT use the "Sign Up" form on the admin page (it was intentionally removed).
New admins must be created via Supabase Dashboard:

1. **Authentication > Users > Invite User**
2. User confirms email
3. Insert role in `user_roles` table (see Step 1 above)

---

## Environment Variables Required

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Both values are in: **Supabase Dashboard > Settings > API**
