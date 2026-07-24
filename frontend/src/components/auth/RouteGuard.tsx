"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      window.location.href = "/login";
    }
  }, [isLoading, user, isPublic, pathname]);

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

  return <>{children}</>;
}
