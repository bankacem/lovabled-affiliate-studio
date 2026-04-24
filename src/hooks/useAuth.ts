import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// FIX: Use lowercase comparison — Supabase stores emails lowercase but let's be safe
const ADMIN_EMAILS = ["admin@aiprintverse.com"];

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const isSupabaseReady = Boolean(
    supabase && typeof supabase.auth?.getSession === "function"
  );

  // ── Layer 1: Instant email check ──────────────────────────────
  // ── Layer 2: RPC has_role ─────────────────────────────────────
  // ── Layer 3: Direct DB query ──────────────────────────────────
  // ── Layer 4: Retry with backoff (max 3x) ──────────────────────
  const checkAdminRole = async (
    userObj: User,
    retryCount = 0
  ): Promise<boolean> => {
    // LAYER 1: Email whitelist (case-insensitive) — no DB needed
    if (isAdminEmail(userObj.email)) {
      // Insert admin role in background (fire-and-forget)
      ensureAdminRoleInDB(userObj.id).catch(() => {});
      return true;
    }

    if (!isSupabaseReady) return false;

    const maxRetries = 3;

    try {
      // LAYER 2: RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "has_role",
        { _user_id: userObj.id, _role: "admin" }
      );
      if (!rpcError && rpcData === true) return true;

      // LAYER 3: Direct query (fallback if RPC not available)
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userObj.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleError && roleData) return true;

      // LAYER 4: Retry
      if (retryCount < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (retryCount + 1)));
        return checkAdminRole(userObj, retryCount + 1);
      }

      return false;
    } catch (err) {
      console.error(`Admin check failed (attempt ${retryCount + 1}):`, err);
      if (retryCount < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (retryCount + 1)));
        return checkAdminRole(userObj, retryCount + 1);
      }
      return false;
    }
  };

  const ensureAdminRoleInDB = async (userId: string) => {
    if (!isSupabaseReady) return;
    try {
      await supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role: "admin" },
          { onConflict: "user_id,role" }
        )
        .maybeSingle();
    } catch {
      // Silently ignore — role may already exist or RLS may block it
    }
  };

  useEffect(() => {
    if (!isSupabaseReady) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);
          const adminResult = await checkAdminRole(existingSession.user);
          if (isMounted) setIsAdmin(adminResult);
        } else {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const adminResult = await checkAdminRole(newSession.user);
        if (isMounted) {
          setIsAdmin(adminResult);
          setIsLoading(false);
        }
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady)
      return { error: new Error("Backend not available. Check env variables.") };
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) setIsLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseReady)
      return { error: new Error("Backend not available.") };
    const { error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseReady) return { error: new Error("Backend not available.") };
    const { error } = await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    return { error };
  };

  return { user, session, isLoading, isAdmin, signIn, signUp, signOut };
}
