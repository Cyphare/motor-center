"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { AuthResult, User } from "@/types/api";
import * as authService from "@/services/auth";
import {
  clearSession,
  getStoredUser,
  getToken,
  setSession,
  setStoredUser,
  subscribe,
} from "@/lib/session";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (result: AuthResult) => void;
  logout: () => void;
  refresh: () => Promise<User | null>;
  setUser: (user: User) => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Lazy initializers read the persisted session on the first client render,
  // avoiding synchronous setState inside the hydration effect.
  const [user, setUserState] = React.useState<User | null>(() => getStoredUser());
  const [token, setTokenState] = React.useState<string | null>(() => getToken());
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Confirm the persisted session against /auth/me, then mark as hydrated.
  React.useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      // Yield a microtask so no setState runs synchronously in the effect body.
      await Promise.resolve();
      const storedToken = getToken();
      if (cancelled) return;
      if (storedToken) {
        try {
          const fresh = await authService.me();
          if (!cancelled) {
            setUserState(fresh);
            setStoredUser(fresh);
          }
        } catch {
          // 401 already clears the session via the api-client interceptor.
          if (!cancelled) {
            setUserState(null);
            setTokenState(null);
          }
        }
      }
      if (!cancelled) {
        setIsHydrated(true);
      }
    }
    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep context in sync when the session store is cleared elsewhere (401).
  React.useEffect(() => {
    return subscribe(() => {
      const currentToken = getToken();
      setTokenState(currentToken);
      setUserState(getStoredUser());
      if (!currentToken) {
        queryClient.clear();
      }
    });
  }, [queryClient]);

  const login = React.useCallback((result: AuthResult) => {
    setSession(result.accessToken, result.user);
    setTokenState(result.accessToken);
    setUserState(result.user);
  }, []);

  const logout = React.useCallback(() => {
    clearSession();
    setTokenState(null);
    setUserState(null);
    queryClient.clear();
  }, [queryClient]);

  const refresh = React.useCallback(async () => {
    try {
      const fresh = await authService.me();
      setUserState(fresh);
      setStoredUser(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const setUser = React.useCallback((next: User) => {
    setUserState(next);
    setStoredUser(next);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isHydrated,
      login,
      logout,
      refresh,
      setUser,
    }),
    [user, token, isHydrated, login, logout, refresh, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
