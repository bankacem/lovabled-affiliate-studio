import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer admin check with setTimeout
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string, retryCount = 0) => {
    const maxRetries = 3;
    console.log(`Checking admin role for user ${userId} (Attempt ${retryCount + 1})`);
    
    try {
      // First try RPC function
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      
      if (error) console.error("RPC has_role error:", error);
      console.log("RPC has_role result:", data);

      if (!error && data === true) {
        console.log("User confirmed as admin via RPC");
        setIsAdmin(true);
        return;
      }
      
      // Fallback: Direct query to user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (roleError) console.error("Query user_roles error:", roleError);
      console.log("Query user_roles result:", roleData);

      if (!roleError && roleData) {
        console.log("User confirmed as admin via database query");
        setIsAdmin(true);
        return;
      }
      
      // If no role found and we haven't maxed retries, wait and retry
      // This handles race conditions when session is still being established
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return checkAdminRole(userId, retryCount + 1);
      }
      
      setIsAdmin(false);
    } catch (err) {
      console.error('Error checking admin role:', err);
      // Retry on error
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return checkAdminRole(userId, retryCount + 1);
      }
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setIsAdmin(false);
    return { error };
  };

  return {
    user,
    session,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  };
}
