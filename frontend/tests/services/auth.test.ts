jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
import { authService } from "@/services/auth";

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("login calls correct endpoint", () => {
    const data = { email: "test@example.com", password: "password123" };
    authService.login(data);
    expect(mockPost).toHaveBeenCalledWith("/auth/login", data);
  });

  it("loginWithPhone calls correct endpoint", () => {
    const data = { phone: "+251911000000", password: "pass123" };
    authService.loginWithPhone(data);
    expect(mockPost).toHaveBeenCalledWith("/auth/login/phone", data);
  });

  it("register calls correct endpoint", () => {
    const data = { email: "test@example.com", firstName: "John" };
    authService.register(data);
    expect(mockPost).toHaveBeenCalledWith("/auth/register", data);
  });

  it("logout calls correct endpoint", () => {
    authService.logout();
    expect(mockPost).toHaveBeenCalledWith("/auth/logout");
  });

  it("refreshToken calls correct endpoint", () => {
    authService.refreshToken("refresh-token-123");
    expect(mockPost).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh-token-123" });
  });

  it("forgotPassword calls correct endpoint", () => {
    const data = { email: "test@example.com" };
    authService.forgotPassword(data);
    expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", data);
  });

  it("resetPassword calls correct endpoint", () => {
    const data = { token: "abc", password: "newpass123", confirmPassword: "newpass123" };
    authService.resetPassword(data);
    expect(mockPost).toHaveBeenCalledWith("/auth/reset-password", data);
  });

  it("verifyEmail calls correct endpoint", () => {
    authService.verifyEmail("token-xyz");
    expect(mockPost).toHaveBeenCalledWith("/auth/verify-email", { token: "token-xyz" });
  });

  it("verifyPhone calls correct endpoint", () => {
    authService.verifyPhone("123456");
    expect(mockPost).toHaveBeenCalledWith("/auth/verify-phone", { otp: "123456" });
  });

  it("sendPhoneOtp calls correct endpoint", () => {
    authService.sendPhoneOtp();
    expect(mockPost).toHaveBeenCalledWith("/auth/send-phone-otp");
  });

  it("getProfile calls correct endpoint", () => {
    authService.getProfile();
    expect(mockGet).toHaveBeenCalledWith("/auth/me");
  });
});
