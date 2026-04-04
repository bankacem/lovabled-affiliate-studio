import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    if (!supabase || typeof supabase.rpc !== 'function') {
      return;
    }

    const maxRetries = 3;
    
    try {
      // First try RPC function
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      
      if (!error && data === true) {
        setIsAdmin(true);
        return;
      }
      
      // Fallback: Direct query to user_roles table
      const { data: roleData, error: roleError } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!roleError && roleData) {
        setIsAdmin(true);
        return;
      }
      
      // If no role found and we haven't maxed retries, wait and retry
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return checkAdminRole(userId, retryCount + 1);
      }
      
      setIsAdmin(false);
    } catch (err) {
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return checkAdminRole(userId, retryCount + 1);
      }
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !supabase.auth) {
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdminRole(session.user.id);
        }
      } catch (error) {
        // Silent error
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    if (!supabase || !supabase.auth) return { error: new Error("Supabase auth not initialized") };
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    if (!supabase || !supabase.auth) return { error: new Error("Supabase auth not initialized") };
    const res = await supabase.auth.signOut();
    setIsAdmin(false);
    return res;
  };

  return {
    user,
    session,
    isLoading,
    isAdmin,
    signIn,
    signOut,
  };
}
