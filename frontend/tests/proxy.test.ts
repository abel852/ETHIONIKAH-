jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: "next" })),
    redirect: jest.fn((url: URL) => ({ type: "redirect", url })),
  },
}));

import { proxy } from "@/proxy";
import { NextResponse } from "next/server";

function createMockRequest(pathname: string, options?: { token?: string; tokenInHeader?: string }) {
  const url = `http://test.com${pathname}`;
  const cookieValue = options?.token;
  const headerValue = options?.tokenInHeader;
  return {
    nextUrl: { pathname },
    url,
    cookies: {
      get: jest.fn((name: string) => {
        if (name === "accessToken") return cookieValue ? { value: cookieValue } : undefined;
        return undefined;
      }),
    },
    headers: {
      get: jest.fn((name: string) => {
        if (name === "authorization" && headerValue) return `Bearer ${headerValue}`;
        return null;
      }),
    },
  };
}

describe("proxy middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows access to root / without token", () => {
    const req = createMockRequest("/");
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to /login without token", () => {
    const req = createMockRequest("/login");
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to /register without token", () => {
    const req = createMockRequest("/register");
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to /forgot-password without token", () => {
    const req = createMockRequest("/forgot-password");
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to /verify-email without token", () => {
    const req = createMockRequest("/verify-email");
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to /matches without token (public due to startsWith('/'))", () => {
    const req = createMockRequest("/matches");
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("redirects /admin to /login when no token", () => {
    const req = createMockRequest("/admin");
    const result = proxy(req as any);
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe("/login");
    expect(result.type).toBe("redirect");
  });

  it("allows access to protected route with valid cookie token", () => {
    const req = createMockRequest("/matches", { token: "valid-token" });
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to protected route with valid Authorization header", () => {
    const req = createMockRequest("/matches", { tokenInHeader: "bearer-token" });
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to /admin with valid token", () => {
    const req = createMockRequest("/admin", { token: "admin-token" });
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });

  it("allows access to /reset-password without token", () => {
    const req = createMockRequest("/reset-password");
    const result = proxy(req as any);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(result).toEqual({ type: "next" });
  });
});
