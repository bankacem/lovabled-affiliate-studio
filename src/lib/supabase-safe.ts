import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const memoryStore = new Map<string, string>();

const memoryStorage: StorageAdapter = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: (key) => {
    memoryStore.delete(key);
  },
};

const canUseStorage = (storage: Storage): boolean => {
  try {
    const testKey = "__aiprintverse_storage_test__";
    storage.setItem(testKey, "ok");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const getSafeStorage = (): StorageAdapter => {
  if (typeof window === "undefined") return memoryStorage;

  if (typeof window.localStorage !== "undefined" && canUseStorage(window.localStorage)) {
    return window.localStorage;
  }

  if (typeof window.sessionStorage !== "undefined" && canUseStorage(window.sessionStorage)) {
    return window.sessionStorage;
  }

  return memoryStorage;
};

const createSafeSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error("Backend credentials are missing.");
    return {} as any;
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
    console.error("Primary backend client initialization failed:", error);

    try {
      return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    } catch (fallbackError) {
      console.error("Fallback backend client initialization failed:", fallbackError);
      return {} as any;
    }
  }
};

export const supabase = createSafeSupabaseClient();