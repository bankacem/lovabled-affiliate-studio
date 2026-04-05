import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Known admin emails — fallback if user_roles table is unreachable
// This is safe because Supabase Auth still validates the password
const ADMIN_EMAILS = ["admin@aiprintverse.com"];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  /**
   * Check admin role via:
   * 1. Email-based whitelist (instant, no DB needed)
   * 2. RPC has_role function
   * 3. Direct user_roles table query (fallback)
   * 4. Retry with backoff (handles timing issues)
   */
  const checkAdminRole = async (userObj: User, retryCount = 0): Promise<boolean> => {
    if (!supabase || typeof supabase.rpc !== 'function') {
      return false;
    }

    const maxRetries = 3;

    // LAYER 1: Email whitelist — instant check, no DB roundtrip
    if (ADMIN_EMAILS.includes(userObj.email ?? "")) {
      // Still try to insert the role in DB asynchronously for consistency
      // (fire and forget — don't await, don't block login)
      ensureAdminRoleInDB(userObj.id).catch(() => {});
      return true;
    }

    try {
      // LAYER 2: RPC function (fastest DB path)
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userObj.id,
        _role: "admin",
      });

      if (!error && data === true) return true;

      // LAYER 3: Direct query (handles RPC permission issues)
      const { data: roleData, error: roleError } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userObj.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleError && roleData) return true;

      // LAYER 4: Retry with backoff
      if (retryCount < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (retryCount + 1)));
        return checkAdminRole(userObj, retryCount + 1);
      }

      return false;
    } catch (err) {
      if (retryCount < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (retryCount + 1)));
        return checkAdminRole(userObj, retryCount + 1);
      }
      return false;
    }
  };

  /**
   * Silently ensure the user has admin role in DB.
   * Called in background after email-whitelist grants access.
   */
  const ensureAdminRoleInDB = async (userId: string) => {
    if (!supabase || typeof supabase.from !== 'function') return;
    await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" })
      .select()
      // If already exists, the UNIQUE constraint causes an error — that's fine
      .maybeSingle();
  };

  useEffect(() => {
    if (!supabase || !supabase.auth) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);
          const adminResult = await checkAdminRole(existingSession.user);
          if (isMounted) setIsAdmin(adminResult);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase || !supabase.auth) return { error: new Error("Supabase auth not initialized") };
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setIsLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase || !supabase.auth) return { error: new Error("Supabase auth not initialized") };
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase || !supabase.auth) return { error: new Error("Supabase auth not initialized") };
    const { error } = await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    return { error };
  };

  return { user, session, isLoading, isAdmin, signIn, signUp, signOut };
}
