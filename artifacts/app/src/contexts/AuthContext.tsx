import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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

  async function fetchMe() {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/auth/me`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.id === "anonymous" ? null : data);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const res = await fetch(`/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { error: { message: err.error || "Sign in failed" } };
      }
      const data = await res.json();
      localStorage.setItem("auth_token", data.token);
      setUser(data.user);
      return { error: null };
    } catch (e: any) {
      return { error: { message: e?.message || "Sign in failed" } };
    }
  }

  async function signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const res = await fetch(`/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { error: { message: err.error || "Sign up failed" } };
      }
      const data = await res.json();
      localStorage.setItem("auth_token", data.token);
      setUser(data.user);
      return { error: null };
    } catch (e: any) {
      return { error: { message: e?.message || "Sign up failed" } };
    }
  }

  async function signOut() {
    localStorage.removeItem("auth_token");
    setUser(null);
    await fetch(`/api/auth/signout`, { method: "POST" }).catch(() => {});
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
