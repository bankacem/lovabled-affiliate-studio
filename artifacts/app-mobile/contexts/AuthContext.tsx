import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "auth_token";

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

const apiBase = () =>
  process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

function normaliseUser(raw: any): User {
  return {
    id: raw.id ?? "",
    email: raw.email ?? "",
    isAdmin: raw.isAdmin === true,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((t: string | null) => {
    setToken(t);
    setAuthTokenGetter(t ? () => Promise.resolve(t) : () => Promise.resolve(null));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          applyToken(stored);
          const res = await fetch(`${apiBase()}/api/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(normaliseUser(data.user ?? data));
          } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
            applyToken(null);
          }
        }
      } catch {
        applyToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [applyToken]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${apiBase()}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Sign in failed");
      }
      const data = await res.json();
      const t: string = data.token;
      await AsyncStorage.setItem(TOKEN_KEY, t);
      applyToken(t);
      setUser(normaliseUser(data.user));
    },
    [applyToken]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${apiBase()}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Sign up failed");
      }
      const data = await res.json();
      const t: string = data.token;
      await AsyncStorage.setItem(TOKEN_KEY, t);
      applyToken(t);
      setUser(normaliseUser(data.user));
    },
    [applyToken]
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
