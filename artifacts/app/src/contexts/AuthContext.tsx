import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
}

interface AuthError {
  message: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function checkAdminRole(authUser: User): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: authUser.id,
        _role: "admin",
      });

      if (!error && data === true) return true;

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .eq("role", "admin")
        .maybeSingle();

      return !roleError && Boolean(roleData);
    } catch {
      return false;
    }
  }

  async function applyAuthUser(authUser: User | null) {
    if (!authUser) {
      setUser(null);
      return;
    }

    const isAdmin = await checkAdminRole(authUser);
    setUser({
      id: authUser.id,
      email: authUser.email ?? null,
      isAdmin,
    });
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => void applyAuthUser(session.user), 0);
      } else {
        setUser(null);
      }
    });

    supabase.auth.getUser().then(({ data }) => applyAuthUser(data.user)).finally(() => {
      setIsLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { error: { message: error.message } };
      await applyAuthUser(data.user);
      return { error: null };
    } catch (e: any) {
      return { error: { message: e?.message || "Sign in failed" } };
    }
  }

  async function signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return { error: { message: error.message } };
      await applyAuthUser(data.user);
      return { error: null };
    } catch (e: any) {
      return { error: { message: e?.message || "Sign up failed" } };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin: user?.isAdmin ?? false, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
