import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Accept": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const networkToast = { id: "network-error" };

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!error.config) return Promise.reject(error);

    const original = error.config;

    // Token expiry - auto refresh
    if (error.response?.status === 401 && !original._retry) {
      // Session invalidated (tokenVersion mismatch) — don't retry, redirect immediately
      if (error.response?.data?.error?.includes("Session invalidated") || error.response?.data?.error?.includes("Account not found")) {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
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
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        sessionStorage.setItem("accessToken", data.accessToken);
        if (typeof document !== "undefined") {
          document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Lax`;
        }
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    // Network / connection errors
    if (!error.response) {
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        toast.error("No internet connection. Check your network.", { id: networkToast.id, duration: 5000 });
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("Request timed out. Please try again.", { id: networkToast.id, duration: 5000 });
      } else {
        toast.error("Network error. Please try again.", { id: networkToast.id, duration: 5000 });
      }
      return Promise.reject(error);
    }

    // Server errors
    const status = error.response.status;
    const serverMsg = error.response.data?.error || error.response.data?.message || "";

    // Catch-all: any 401 that wasn't handled above — redirect to login
    if (status === 401) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
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
      if (serverMsg && !original._noToast) {
        toast.error(serverMsg, { id: "server-error", duration: 4000 });
      }
      return Promise.reject(error);
    } else if (status === 403) {
      // Suspended/deleted account — redirect to login
      if (serverMsg?.includes("suspended") || serverMsg?.includes("deleted") || error.response.data?.code === "ACCOUNT_DELETED") {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
      if (serverMsg && !original._noToast) {
        toast.error(serverMsg, { duration: 4000 });
      }
    } else if (status === 429) {
      // Rate limited — show error toast overlay
      if (serverMsg && !original._noToast) {
        toast.error(serverMsg, { duration: 5000, id: "rate-limited" });
      }
      return Promise.reject(error);
    } else if (status >= 400) {
      if (serverMsg && !original._noToast) {
        toast.error(serverMsg, { duration: 4000 });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
