"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import api from "@/lib/api";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone", "/contact-support", "/wali"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// Routes that only regular users (not admins) should access
const USER_ONLY_ROUTES = [
  "/matches", "/discover", "/search", "/favorites", "/liked-interest",
  "/messages", "/notifications", "/profile", "/preferences",
  "/verification", "/health-info", "/settings", "/membership",
];
function isUserOnlyRoute(pathname: string): boolean {
  return USER_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, logout, connectionError } = useAuth();
  const { t } = useI18n();

  const isPublic = isPublicRoute(pathname);
  const isAdmin = isAdminRoute(pathname);
  const isUserOnly = isUserOnlyRoute(pathname);

  useEffect(() => {
    if (isLoading || isPublic) return;

    // Server down — don't redirect, let the banner show
    if (connectionError === "server_down") return;

    // No user — clear cookie then redirect to login
    if (!user) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      if (typeof document !== "undefined") {
        document.cookie = "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      window.location.href = "/login";
      return;
    }

    // Admin accessing user-only routes — block account and logout
    if (isUserOnly && user.role === "admin") {
      api.post("/auth/security-block", { reason: `Admin accessing user route: ${pathname}` }, { _noRedirect: true, _noToast: true } as any).catch(() => {});
      logout();
      window.location.href = "/login";
      return;
    }

    // Non-admin accessing admin routes — block account and logout
    if (isAdmin && user.role !== "admin") {
      api.post("/auth/security-block", { reason: `User accessing admin route: ${pathname}` }, { _noRedirect: true, _noToast: true } as any).catch(() => {});
      logout();
      window.location.href = "/login";
      return;
    }
  }, [isLoading, user, isPublic, isAdmin, isUserOnly, pathname, logout, connectionError]);

  // Show loading spinner while auth is being verified on protected routes
  if (!isPublic && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-charcoal-900">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Block rendering of protected pages when no user (but allow if server is down)
  if (!isPublic && !user && connectionError !== "server_down") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-charcoal-900">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Block non-admin users from admin pages
  if (isAdmin && user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-charcoal-900">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('common.accessDenied')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('common.redirecting')}</p>
        </div>
      </div>
    );
  }

  // Block admin users from user-only pages
  if (isUserOnly && user && user.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-charcoal-900">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('common.accessDenied')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('common.redirecting')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
