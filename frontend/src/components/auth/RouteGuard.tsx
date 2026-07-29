"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone", "/contact-support"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isPublic = isPublicRoute(pathname);
  const isAdmin = isAdminRoute(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      window.location.href = "/login";
    }
    // Redirect non-admin users away from admin routes
    if (!isLoading && user && isAdmin && user.role !== "admin") {
      window.location.href = "/matches";
    }
  }, [isLoading, user, isPublic, isAdmin, pathname]);

  // Show loading spinner while auth is being verified on protected routes
  if (!isPublic && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-charcoal-900">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Block rendering of protected pages when no user
  if (!isPublic && !user) {
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
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Access Denied</p>
          <p className="text-sm text-gray-500 mt-1">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
