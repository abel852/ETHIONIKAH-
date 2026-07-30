import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================
// Proxy — Next.js 16 replacement for middleware
// Combines: CSP nonce injection + security headers + auth routing
// ============================================================

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// Decode JWT payload without verifying (verification happens on backend)
function getJwtRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone", "/contact-support"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
const adminRoutes = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value || request.headers.get("authorization")?.replace("Bearer ", "");

  // --- Auth routing ---
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // No token + protected route → redirect to login
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists + on auth routes (login/register) → redirect to appropriate dashboard
  if (token && isAuthRoute) {
    const role = getJwtRole(token);
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (role === "user") {
      return NextResponse.redirect(new URL("/matches", request.url));
    }
  }

  // Admin route + token exists but role is not admin → redirect to login
  if (isAdmin && token) {
    const role = getJwtRole(token);
    if (role !== "admin") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "access_denied");
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- CSP nonce + security headers ---
  const nonce = generateNonce();
  const isProduction = process.env.NODE_ENV === "production";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const apiBase = apiUrl.replace(/\/api$/, "");
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProduction ? "" : " 'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-hashes' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://images.unsplash.com ${apiBase} ${isProduction ? "" : "http://localhost:*"}`,
    `media-src 'self' data: blob:`,
    `connect-src 'self' ${apiUrl} ${apiBase} ${apiBase.replace(/^http/, "ws")} ${appOrigin}`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");

  // Cache static assets aggressively in the browser
  if (pathname.startsWith("/_next/static/")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/)) {
    response.headers.set("Cache-Control", "public, max-age=604800, immutable");
  } else {
    response.headers.set("Cache-Control", "no-cache, must-revalidate");
  }

  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Expose nonce to the app via a request header so layout can read it
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest).*$).*)",
  ],
};
