import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Accept": "application/json" },
  withCredentials: true,
});

// --- Client-side GET cache (short TTL, stale-while-revalidate) ---
const clientCache = new Map<string, { data: any; ts: number }>();
const CLIENT_CACHE_TTL = 15000; // 15 seconds

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Store successful GET responses in client cache
    if (res.config?.method === "get" && res.status === 200 && !res.config._skipCache) {
      const key = `${res.config.baseURL}${res.config.url}`;
      clientCache.set(key, { data: res, ts: Date.now() });
      if (clientCache.size > 100) {
        const oldest = clientCache.keys().next().value;
        if (oldest) clientCache.delete(oldest);
      }
    }
    return res;
  },
  async (error) => {
    if (!error.config) return Promise.reject(error);

    // On network error, try to serve from stale client cache
    if (!error.response && error.config?.method === "get") {
      const key = `${error.config.baseURL}${error.config.url}`;
      const entry = clientCache.get(key);
      if (entry) return Promise.resolve(entry.data);
    }

    const networkToast = { id: "network-error" };

    const original = error.config;

    // Token expiry - auto refresh
    if (error.response?.status === 401 && !original._retry) {
      // Session invalidated (tokenVersion mismatch) — don't retry, redirect immediately
      if (error.response?.data?.error?.includes("Session invalidated") || error.response?.data?.error?.includes("Account not found")) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof document !== "undefined") {
          document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
      if (!original.headers?.Authorization) {
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        if (typeof document !== "undefined") {
          document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Lax`;
        }
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof document !== "undefined") {
          document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    // Network / connection errors
    if (!error.response) {
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        toast.error("No internet connection. Check your network.", { id: networkToast.id, duration: 1000 });
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("Request timed out. Please try again.", { id: networkToast.id, duration: 1000 });
      } else {
        toast.error("Network error. Please try again.", { id: networkToast.id, duration: 1000 });
      }
      return Promise.reject(error);
    }

    // Server errors
    const status = error.response.status;
    const serverMsg = error.response.data?.error || error.response.data?.message || "";

    // Catch-all: any 401 that wasn't handled above — redirect to login
    if (status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      if (typeof document !== "undefined") {
        document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (status === 503 && error.response.data?.code === "SERVER_BUSY") {
      // Graceful overload — don't show generic "server down" toast; caller handles it
      return Promise.reject(error);
    } else if (status >= 500) {
      // Only show toast if the server provided a specific error message
      if (serverMsg && !original.headers?.["X-No-Toast"]) {
        toast.error(serverMsg, { id: "server-error", duration: 1000 });
      }
      return Promise.reject(error);
    } else if (status === 403) {
      // Suspended/deleted account or insufficient permissions — clear auth and redirect
      if (
        serverMsg?.includes("suspended") ||
        serverMsg?.includes("deleted") ||
        serverMsg?.includes("Insufficient permissions") ||
        error.response.data?.code === "ACCOUNT_DELETED"
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("trustedDeviceToken");
        if (typeof document !== "undefined") {
          document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
      if (serverMsg && !original.headers?.["X-No-Toast"]) {
        toast.error(serverMsg, { duration: 1000 });
      }
    } else if (status === 429) {
      // Rate limited — show error toast overlay
      if (serverMsg && !original.headers?.["X-No-Toast"]) {
        toast.error(serverMsg, { duration: 1000, id: "rate-limited" });
      }
      return Promise.reject(error);
    } else if (status >= 400) {
      if (serverMsg && !original.headers?.["X-No-Toast"]) {
        toast.error(serverMsg, { duration: 1000 });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
