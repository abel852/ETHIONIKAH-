import api from "@/lib/api";
import type { LoginFormData, ForgotPasswordFormData, ResetPasswordFormData } from "@/lib/validations";

export const authService = {
  login: (data: LoginFormData) => api.post("/auth/login", data),
  loginWithPhone: (data: { phone: string; password: string }) => api.post("/auth/login/phone", data),
  register: (data: Record<string, unknown>) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  refreshToken: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }),
  forgotPassword: (data: ForgotPasswordFormData) => api.post("/auth/forgot-password", data),
  resetPassword: (data: ResetPasswordFormData) => api.post("/auth/reset-password", data),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  verifyPhone: (otp: string) => api.post("/auth/verify-phone", { otp }),
  sendPhoneOtp: () => api.post("/auth/send-phone-otp"),
  getProfile: () => api.get("/auth/me"),
  verifyPassword: (password: string) => api.post("/auth/verify-password", { password }),
};
