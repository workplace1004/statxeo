import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { env } from "../config/env";

const TOKEN_KEY = "statxeo_mobile_token";

export type AuthSession = {
  token: string;
  email: string;
  name: string;
  persona: string;
  avatarUrl: string | null;
};

type AuthContextValue = {
  loading: boolean;
  session: AuthSession | null;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  // On app start: check for a stored token and validate it with the server
  useEffect(() => {
    async function restore() {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) {
          setLoading(false);
          return;
        }

        // Validate token is still good and fetch fresh user info
        const res = await fetch(`${env.siteUrl}/api/mobile/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setSession({
            token,
            email: data.email,
            name: data.name,
            persona: data.persona,
            avatarUrl: data.avatarUrl ?? null,
          });
        } else {
          // Token invalid or expired — clear it
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      } catch {
        // Network error on restore — clear to be safe
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    }

    void restore();
  }, []);

  const signIn = useCallback(async (email: string, password?: string) => {
    const res = await fetch(`${env.siteUrl}/api/mobile/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, persona: "white-label" }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.error?.message ?? "Sign in failed. Please try again.";
      throw new Error(message);
    }

    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setSession({
      token: data.token,
      email: data.email,
      name: data.name,
      persona: data.persona,
      avatarUrl: null,
    });
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, session, signIn, signOut }),
    [loading, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
