import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const noop = () => Promise.resolve({ data: null, error: null });
const noopSub = { data: { subscription: { unsubscribe: () => {} } } };

const createSafeClient = () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return {
      from: (_t: string) => ({
        select: (_c?: string) => ({
          eq: (_col: string, _val: any) => ({ order: noop, maybeSingle: noop, single: noop, limit: () => noop(), data: null, error: null }),
          order: (_col: string, _opts?: any) => ({ data: null, error: null }),
          limit: (_n: number) => ({ data: null, error: null }),
          ilike: (_col: string, _pat: string) => ({ limit: () => noop() }),
        }),
        insert: noop,
        update: (_v: any) => ({ eq: (_c: string, _v: any) => noop() }),
        delete: () => ({ eq: (_c: string, _v: any) => noop() }),
        upsert: (_v: any) => ({ select: () => ({ maybeSingle: noop }) }),
      }),
      auth: {
        onAuthStateChange: (_cb: any) => noopSub,
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: (_c: any) => Promise.resolve({ data: null, error: { message: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to Vercel Environment Variables then Redeploy.' } }),
        signUp: (_c: any) => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
      rpc: (_fn: string, _args?: any) => noop(),
      functions: { invoke: (_fn: string, _opts?: any) => noop() },
      storage: { from: (_b: string) => ({ upload: noop, getPublicUrl: (_p: string) => ({ data: { publicUrl: '' } }) }) },
    } as any;
  }
  try {
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
    });
  } catch (e) {
    console.error('Supabase init failed:', e);
    return {} as any;
  }
};

export const supabase = createSafeClient();
