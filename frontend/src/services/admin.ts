import api from "@/lib/api";

export const adminService = {
  // Users
  getUsers: (params?: Record<string, unknown>) => api.get("/admin/users", { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  suspendUser: (id: string, reason?: string) => api.post(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  banUser: (id: string, reason?: string) => api.post(`/admin/users/${id}/ban`, { reason }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  verifyUser: (id: string) => api.post(`/admin/users/${id}/verify`),
  restrictUserChat: (id: string, duration: number | null, reason?: string) => api.post(`/admin/users/${id}/restrict-chat`, { duration, reason }),
  removeUserRestriction: (id: string, type: string) => api.post(`/admin/users/${id}/remove-restriction`, { type }),
  getUserRestrictions: (id: string) => api.get(`/admin/users/${id}/restrictions`),
  resetUserPassword: (id: string, newPassword: string) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),

  // Dashboard & Analytics
  getDashboardData: () => api.get("/admin/dashboard"),
  getAnalytics: () => api.get("/admin/analytics"),
  getRetentionMetrics: () => api.get("/admin/retention"),
  getUserFunnel: () => api.get("/admin/funnel"),
  getEngagementHeatmap: () => api.get("/admin/engagement-heatmap"),

  // Security
  getAuditLogs: (params?: Record<string, unknown>) => api.get("/admin/audit-logs", { params }),
  getAuditActions: () => api.get("/admin/audit-actions"),
  getSuspiciousActivity: () => api.get("/admin/suspicious-activity"),
  getGDPRRequests: () => api.get("/admin/gdpr"),

  // RBAC
  getAdminPermissions: () => api.get("/admin/permissions"),
  setAdminPermission: (adminId: string, permission: string) => api.post("/admin/permissions", { adminId, permission }),
  removeAdminPermission: (adminId: string, permission: string) => api.delete("/admin/permissions", { data: { adminId, permission } }),

  // Feature Toggles
  getFeatureToggles: () => api.get("/admin/feature-toggles"),
  updateFeatureToggle: (id: string, enabled: boolean) => api.put(`/admin/feature-toggles/${id}`, { enabled }),

  // System Settings
  getSystemSettings: () => api.get("/admin/settings"),
  updateSystemSetting: (data: { key: string; value: any; category?: string }) => api.put("/admin/settings", data),

  // Content Flags
  getContentFlags: (status?: string) => api.get("/admin/content-flags", { params: status ? { status } : {} }),
  reviewContentFlag: (id: string, status: string, adminNote?: string) => api.put(`/admin/content-flags/${id}`, { status, adminNote }),

  // Affiliates & Promotions
  getAffiliateReferrals: () => api.get("/admin/affiliates"),
  getPromotions: () => api.get("/admin/promotions"),
  createPromotion: (data: any) => api.post("/admin/promotions", data),
  updatePromotion: (id: string, data: any) => api.put(`/admin/promotions/${id}`, data),

  // Notification Templates
  getNotificationTemplates: () => api.get("/admin/notification-templates"),
  updateNotificationTemplate: (id: string, data: any) => api.put(`/admin/notification-templates/${id}`, data),

  // Compliance
  getCompliance: () => api.get("/admin/compliance"),

  // Activity Timeline
  getActivityTimeline: () => api.get("/admin/activity-timeline"),

  // Seed
  seedDefaults: () => api.post("/admin/seed"),

  // Admin Management
  sendAdminVerification: (email: string) => api.post("/admin/admins/send-verification", { email }),
  verifyAdminEmail: (email: string, code: string) => api.post("/admin/admins/verify-email", { email, code }),
  setupAdmin2FA: (email: string) => api.post("/admin/admins/setup-2fa", { email }),
  verifyAdmin2FA: (email: string, token: string) => api.post("/admin/admins/verify-2fa", { email, token }),
  createAdmin: (data: any) => api.post("/admin/admins/create", data),
  listAdmins: () => api.get("/admin/admins"),
  updateAdminPermissions: (id: string, permissions: string[]) => api.put(`/admin/admins/${id}/permissions`, { permissions }),
  deleteAdmin: (id: string) => api.delete(`/admin/admins/${id}`),
  getAvailablePermissions: () => api.get("/admin/admins/permissions/list"),

  // Legacy (existing)
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (settings: Record<string, unknown>) => api.put("/admin/settings", settings),
  getActivities: (params?: Record<string, unknown>) => api.get("/admin/activities", { params }),
  getVerifications: (status?: string) => api.get("/verification/admin/all", { params: status ? { status } : {} }),
  approveVerification: (id: string, adminNote?: string) => api.post(`/verification/${id}/approve`, { adminNote }),
  rejectVerification: (id: string, adminNote?: string) => api.post(`/verification/${id}/reject`, { adminNote }),
  getComplaints: (status?: string) => api.get("/complaints/admin/all", { params: status ? { status } : {} }),
  respondToComplaint: (id: string, adminResponse: string, status?: string) => api.post(`/complaints/${id}/respond`, { adminResponse, status }),
  closeComplaint: (id: string, adminResponse?: string) => api.post(`/complaints/${id}/close`, { adminResponse }),
  getReports: (status?: string) => api.get("/reports/admin/all", { params: status ? { status } : {} }),
  updateReportStatus: (id: string, status: string, adminNote?: string) => api.put(`/reports/${id}/status`, { status, adminNote }),
  dismissReport: (id: string, adminNote?: string) => api.post(`/reports/${id}/dismiss`, { adminNote }),
  getSubscriptions: (params?: Record<string, unknown>) => api.get("/subscriptions/admin/subscriptions", { params }),
  getPayments: (params?: Record<string, unknown>) => api.get("/subscriptions/admin/payments", { params }),
  getRevenueStats: () => api.get("/subscriptions/admin/revenue"),
  updateSubscription: (id: string, data: Record<string, unknown>) => api.put(`/subscriptions/admin/subscriptions/${id}`, data),
  cancelSubscription: (id: string) => api.delete(`/subscriptions/admin/subscriptions/${id}`),
};
