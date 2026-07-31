"use client";

import { usePathname } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone", "/contact-support", "/wali"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isPublicRoute(pathname) || isAdminRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <DashboardSidebar />
      {children}
    </>
  );
}
