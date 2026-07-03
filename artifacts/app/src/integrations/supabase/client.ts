// Real Supabase client. The old shim routed everything through /api which
// does not exist on the static Vercel deployment (that caused Dashboard to
// show 0 posts and the "Unexpected token '<'" JSON errors).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Surface a clear error in the console rather than silently failing.
  // eslint-disable-next-line no-console
  console.error("[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sb-aiprintverse-auth",
  },
});
