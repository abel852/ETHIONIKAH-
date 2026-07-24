"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import axios from "axios";
import { WifiOff } from "lucide-react";
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
  connectionError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  function isNetworkError(err: any): boolean {
    if (!err) return false;
    if (err.response?.status >= 500) return true;
    if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED" || err.code === "ECONNABORTED") return true;
    if (err.message?.includes("Network Error") || err.message?.includes("timeout") || err.message?.includes("connect")) return true;
    return false;
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      api.get("/auth/me", { _noRedirect: true } as any).then((res) => {
        const u = mapVerificationStatus(res.data.user);
        setUser(u);
        setConnectionError(null);
        localStorage.setItem("user", JSON.stringify(u));
      }).catch((err) => {
        if (isNetworkError(err)) {
          setConnectionError("server_down");
          const cached = localStorage.getItem("user");
          if (cached) { try { setUser(JSON.parse(cached)); } catch { /* ignore */ } }
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
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
            setConnectionError(null);
            localStorage.setItem("user", JSON.stringify(u));
          })
          .catch((err) => {
            if (isNetworkError(err)) {
              setConnectionError("server_down");
            } else {
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
              localStorage.removeItem("rememberMe");
              setUser(null);
              if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login";
              }
            }
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
    // Fetch full user data including membershipPlan
    try {
      const { data: fullUser } = await api.get("/auth/me", { _noRedirect: true } as any);
      const u = mapVerificationStatus(fullUser.user);
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    } catch { /* ignore */ }
  }, []);

  const register = useCallback(async (formData: Record<string, unknown>) => {
    const { data } = await api.post("/auth/register", formData);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(mapVerificationStatus(data.user));
    try {
      const { data: fullUser } = await api.get("/auth/me", { _noRedirect: true } as any);
      const u = mapVerificationStatus(fullUser.user);
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    } catch { /* ignore */ }
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
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, connectionError, login, register, logout, updateUser }}>
      {connectionError === "server_down" && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Server is currently down. Please wait...</span>
          <button onClick={() => window.location.reload()} className="ml-2 underline text-white/90 hover:text-white font-medium">Retry</button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
