"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/modules/auth/services/auth.service";
import {
  clearTokens,
  getRefreshToken,
  loadTokensFromStorage,
  setTokens,
} from "@/shared/auth/token-store";
import type { IUser } from "@/shared/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface IAuthContextValue {
  user: IUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<IAuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    loadTokensFromStorage();
    authService
      .me()
      .then((profile) => {
        setUser(profile);
        setStatus("authenticated");
      })
      .catch(() => {
        clearTokens();
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    setTokens(result);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await authService.signup({ name, email, password });
      setTokens(result);
      setUser(result.user);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {});
    }
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): IAuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
