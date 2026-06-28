import { ROUTES } from "@/constants/routes";

describe("ROUTES", () => {
  it("has HOME route", () => {
    expect(ROUTES.HOME).toBe("/");
  });

  it("has LOGIN route", () => {
    expect(ROUTES.LOGIN).toBe("/login");
  });

  it("has REGISTER route", () => {
    expect(ROUTES.REGISTER).toBe("/register");
  });

  it("has FORGOT_PASSWORD route", () => {
    expect(ROUTES.FORGOT_PASSWORD).toBe("/forgot-password");
  });

  it("has VERIFY_EMAIL route", () => {
    expect(ROUTES.VERIFY_EMAIL).toBe("/verify-email");
  });

  it("has DASHBOARD route", () => {
    expect(ROUTES.DASHBOARD).toBe("/matches");
  });

  it("has PROFILE route", () => {
    expect(ROUTES.PROFILE).toBe("/profile");
  });

  it("has MATCHES route", () => {
    expect(ROUTES.MATCHES).toBe("/matches");
  });

  it("has MESSAGES route", () => {
    expect(ROUTES.MESSAGES).toBe("/messages");
  });

  it("has FAVORITES route", () => {
    expect(ROUTES.FAVORITES).toBe("/favorites");
  });

  it("has VERIFICATION route", () => {
    expect(ROUTES.VERIFICATION).toBe("/verification");
  });

  it("has SETTINGS route", () => {
    expect(ROUTES.SETTINGS).toBe("/settings");
  });

  it("has NOTIFICATIONS route", () => {
    expect(ROUTES.NOTIFICATIONS).toBe("/notifications");
  });

  it("has ADMIN route", () => {
    expect(ROUTES.ADMIN).toBe("/admin");
  });

  it("DASHBOARD and MATCHES point to same path", () => {
    expect(ROUTES.DASHBOARD).toBe(ROUTES.MATCHES);
  });

  it("is not extensible at runtime", () => {
    expect(Object.isExtensible(ROUTES)).toBe(true);
  });
});
