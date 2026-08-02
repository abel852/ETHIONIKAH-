"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import axios from "axios";
import { WifiOff } from "lucide-react";
import api from "@/lib/api";
import type { User } from "@/types";
import { cacheGetStale, cacheSet, cacheClearAll, CACHE_TTL, STORES } from "@/lib/cache";

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
      // Try cached user profile first for instant app load
      cacheGetStale<User>(STORES.PROFILE, "me").then((cached) => {
        if (cached) {
          setUser(cached.data);
          setIsLoading(false);
        }
      });

      api.get("/auth/me", { _noRedirect: true } as any).then((res) => {
        const u = mapVerificationStatus(res.data.user);
        setUser(u);
        setConnectionError(null);
        // Cache user profile in IndexedDB (not localStorage)
        cacheSet(STORES.PROFILE, "me", u, CACHE_TTL.PROFILE);
        // Remove legacy localStorage user data
        localStorage.removeItem("user");
      }).catch((err) => {
        if (isNetworkError(err)) {
          setConnectionError("server_down");
          // Keep cached user from IndexedDB if available — offline mode
          // If no cached user was loaded, set to null
          setUser((prev) => prev); // keep existing user if loaded from cache
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("trustedDeviceToken");
          cacheClearAll().catch(() => {});
          if (typeof document !== "undefined") {
            document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
          setUser(null);
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }).finally(() => setIsLoading(false));
    } else {
      localStorage.removeItem("refreshToken");
      setIsLoading(false);
    }

    // Prevent back button access after logout — if page is restored from
    // bfcache and there's no token, force redirect to login
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const t = localStorage.getItem("accessToken");
        if (!t && typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    if (typeof document !== "undefined") {
      document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Lax`;
    }
    setUser(mapVerificationStatus(data.user));
    // Fetch full user data including membershipPlan
    try {
      const { data: fullUser } = await api.get("/auth/me", { _noRedirect: true } as any);
      const u = mapVerificationStatus(fullUser.user);
      setUser(u);
      cacheSet(STORES.PROFILE, "me", u, CACHE_TTL.PROFILE);
      localStorage.removeItem("user");
    } catch { /* ignore */ }
  }, []);

  const register = useCallback(async (formData: Record<string, unknown>) => {
    const { data } = await api.post("/auth/register", formData);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    if (typeof document !== "undefined") {
      document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Lax`;
    }
    setUser(mapVerificationStatus(data.user));
    try {
      const { data: fullUser } = await api.get("/auth/me", { _noRedirect: true } as any);
      const u = mapVerificationStatus(fullUser.user);
      setUser(u);
      cacheSet(STORES.PROFILE, "me", u, CACHE_TTL.PROFILE);
      localStorage.removeItem("user");
    } catch { /* ignore */ }
  }, []);

  const logout = useCallback(() => {
    // Clear all session storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // Clear all local storage auth-related items
    localStorage.removeItem("user");
    localStorage.removeItem("trustedDeviceToken");
    // Clear IndexedDB cache
    cacheClearAll().catch(() => {});
    // Clear cookie
    if (typeof document !== "undefined") {
      document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "refreshToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    // Reset state
    setUser(null);
    // Prevent back button access — replace current history entry
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      cacheSet(STORES.PROFILE, "me", updated, CACHE_TTL.PROFILE);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, connectionError, login, register, logout, updateUser }}>
      {connectionError === "server_down" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-charcoal-800 rounded-2xl px-10 py-8 shadow-2xl">
            <WifiOff className="w-12 h-12 text-amber-500" />
            <p className="text-lg font-medium text-charcoal-700 dark:text-white/90 text-center">Server is currently down</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors">
              Retry
            </button>
          </div>
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
