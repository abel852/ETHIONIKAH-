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

const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone", "/contact-support"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
const adminRoutes = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value || request.headers.get("authorization")?.replace("Bearer ", "");

  // --- Auth routing ---
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
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
