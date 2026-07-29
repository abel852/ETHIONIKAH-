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
    const token = sessionStorage.getItem("accessToken");

    if (token) {
      api.get("/auth/me", { _noRedirect: true } as any).then((res) => {
        const u = mapVerificationStatus(res.data.user);
        setUser(u);
        setConnectionError(null);
        localStorage.setItem("user", JSON.stringify(u));
      }).catch((err) => {
        if (isNetworkError(err)) {
          // Server down — do NOT fall back to cached user data (security risk).
          // Show the server-down banner but keep user as null so RouteGuard
          // blocks access to protected pages.
          setConnectionError("server_down");
          setUser(null);
        } else {
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }).finally(() => setIsLoading(false));
    } else {
      sessionStorage.removeItem("refreshToken");
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    sessionStorage.setItem("accessToken", data.accessToken);
    sessionStorage.setItem("refreshToken", data.refreshToken);
    if (typeof document !== "undefined") {
      document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Lax`;
    }
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
    sessionStorage.setItem("accessToken", data.accessToken);
    sessionStorage.setItem("refreshToken", data.refreshToken);
    if (typeof document !== "undefined") {
      document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Lax`;
    }
    setUser(mapVerificationStatus(data.user));
    try {
      const { data: fullUser } = await api.get("/auth/me", { _noRedirect: true } as any);
      const u = mapVerificationStatus(fullUser.user);
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    } catch { /* ignore */ }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("trustedDeviceToken");
    if (typeof document !== "undefined") {
      document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
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
