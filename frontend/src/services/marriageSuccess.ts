import api from "@/lib/api";

export const marriageSuccessService = {
  // User routes
  request: () =>
    api.post("/marriage-success/request"),
  confirm: (submissionId: string) =>
    api.post(`/marriage-success/${submissionId}/confirm`),
  uploadPhotos: (submissionId: string, formData: FormData) =>
    api.post(`/marriage-success/${submissionId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMine: () =>
    api.get("/marriage-success/mine"),
  getSubmission: (submissionId: string) =>
    api.get(`/marriage-success/${submissionId}`),
  cancel: (submissionId: string) =>
    api.delete(`/marriage-success/${submissionId}`),
  archiveAccount: () =>
    api.post("/marriage-success/archive-account"),
  deleteAccountVerifyPassword: (password: string) =>
    api.post("/marriage-success/delete-account/verify-password", { password }),
  deleteAccountConfirm: (otp: string) =>
    api.post("/marriage-success/delete-account/confirm", { otp }),

  // Public
  getPublishedStories: (page?: number, limit?: number) =>
    api.get("/marriage-success/public/stories", { params: { page, limit } }),

  // Admin
  adminGetSubmissions: (status?: string) =>
    api.get("/marriage-success/admin/submissions", { params: status ? { status } : {} }),
  adminGetSubmission: (submissionId: string) =>
    api.get(`/marriage-success/admin/submissions/${submissionId}`),
  adminApprove: (submissionId: string, adminNote?: string) =>
    api.post(`/marriage-success/admin/submissions/${submissionId}/approve`, { adminNote }),
  adminReject: (submissionId: string, adminNote?: string) =>
    api.post(`/marriage-success/admin/submissions/${submissionId}/reject`, { adminNote }),
};
