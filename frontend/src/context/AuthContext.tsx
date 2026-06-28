"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import axios from "axios";
import api from "@/lib/api";
import type { User } from "@/types";

function mapVerificationStatus(user: Record<string, unknown>): User {
  if (user.verification && typeof user.verification === "object" && user.verification !== null) {
    const v = user.verification as { status: string };
    if (v.status === "approved") user.verificationStatus = "verified";
    else if (v.status === "pending") user.verificationStatus = "pending";
    else if (v.status === "rejected") user.verificationStatus = "rejected";
    else user.verificationStatus = "unverified";
  } else {
    user.verificationStatus = "unverified";
  }
  return user as unknown as User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      const cached = localStorage.getItem("user");
      if (cached) { try { setUser(JSON.parse(cached)); } catch { /* ignore */ } }
      api.get("/auth/me", { _noRedirect: true } as any).then((res) => {
        const u = mapVerificationStatus(res.data.user);
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      }).catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }).finally(() => setIsLoading(false));
    } else {
      const rememberMe = localStorage.getItem("rememberMe");
      const refreshToken = localStorage.getItem("refreshToken");
      const ts = localStorage.getItem("rememberMeTimestamp");
      const expired = !ts || Date.now() - Number(ts) > 3 * 24 * 60 * 60 * 1000;
      if (expired && rememberMe) {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberMeTimestamp");
      }
      if (rememberMe && refreshToken && !expired) {
        axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
          .then(({ data }) => {
            localStorage.setItem("accessToken", data.accessToken);
            if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
            return api.get("/auth/me", { _noRedirect: true } as any);
          })
          .then((res) => {
            const u = mapVerificationStatus(res.data.user);
            setUser(u);
            localStorage.setItem("user", JSON.stringify(u));
          })
          .catch(() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            localStorage.removeItem("rememberMe");
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(mapVerificationStatus(data.user));
  }, []);

  const register = useCallback(async (formData: Record<string, unknown>) => {
    const { data } = await api.post("/auth/register", formData);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(mapVerificationStatus(data.user));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
