import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ── Storage adapter with fallbacks ──────────────────────────────
type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const memoryStore = new Map<string, string>();
const memoryStorage: StorageAdapter = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => { memoryStore.set(key, value); },
  removeItem: (key) => { memoryStore.delete(key); },
};

const canUseStorage = (storage: Storage): boolean => {
  try {
    const k = "__aipv_test__";
    storage.setItem(k, "ok");
    storage.removeItem(k);
    return true;
  } catch {
    return false;
  }
};

const getSafeStorage = (): StorageAdapter => {
  if (typeof window === "undefined") return memoryStorage;
  if (typeof window.localStorage !== "undefined" && canUseStorage(window.localStorage)) return window.localStorage;
  if (typeof window.sessionStorage !== "undefined" && canUseStorage(window.sessionStorage)) return window.sessionStorage;
  return memoryStorage;
};

// ── Noop stub when env vars are missing ─────────────────────────
const noop = () => Promise.resolve({ data: null, error: null });
const noopChain = (): any =>
  new Proxy(noop, {
    get: () => noopChain(),
    apply: () => Promise.resolve({ data: null, error: null }),
  });

const createStubClient = () => ({
  from: () => noopChain(),
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () =>
      Promise.resolve({
        data: null,
        error: { message: "Backend not available. Please refresh the page." },
      }),
    signUp: () =>
      Promise.resolve({
        data: null,
        error: { message: "Backend not available." },
      }),
    signOut: () => Promise.resolve({ error: null }),
  },
  rpc: noop,
  functions: { invoke: noop },
  channel: () => ({
    on: function () { return this; },
    subscribe: function () { return this; },
    unsubscribe: noop,
  }),
  storage: {
    from: () => ({
      upload: noop,
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
} as any);

// ── Real client creation ────────────────────────────────────────
const createSafeSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    if (import.meta.env.DEV) {
      console.warn("Backend credentials missing — using stub client.");
    }
    return createStubClient();
  }

  try {
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: getSafeStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.error("Primary backend init failed:", error);
    try {
      return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
    } catch {
      console.error("All backend init attempts failed.");
      return createStubClient();
    }
  }
};

export const supabase = createSafeSupabaseClient();
