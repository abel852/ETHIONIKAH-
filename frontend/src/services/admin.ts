import api from "@/lib/api";

export const adminService = {
  // Users
  getUsers: (params?: Record<string, unknown>) => api.get("/admin/users", { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  getUserStats: (id: string) => api.get(`/admin/users/${id}/stats`),

  // Recycle bin
  getDeletedUsers: (params?: Record<string, unknown>) => api.get("/admin/deleted-users", { params }),
  restoreDeletedUser: (id: string) => api.post(`/admin/deleted-users/${id}/restore`),
  purgeDeletedUsers: () => api.post("/admin/deleted-users/purge"),
  suspendUser: (id: string, reason?: string) => api.post(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  banUser: (id: string, reason?: string, durationInDays?: number) => api.post(`/admin/users/${id}/ban`, { reason, durationInDays }),
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  verifyUser: (id: string) => api.post(`/admin/users/${id}/verify`),
  rejectUserVerification: (id: string, reason?: string) => api.post(`/admin/users/${id}/reject-verification`, { reason }),
  restrictUserChat: (id: string, duration: number | null, reason?: string) => api.post(`/admin/users/${id}/restrict-chat`, { duration, reason }),
  removeUserRestriction: (id: string, type: string) => api.post(`/admin/users/${id}/remove-restriction`, { type }),
  getUserRestrictions: (id: string) => api.get(`/admin/users/${id}/restrictions`),
  resetUserPassword: (id: string, newPassword: string) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  markUsersViewed: () => api.post("/admin/users/mark-viewed"),

  // Lockout Management
  pinUser: (id: string) => api.post(`/admin/users/${id}/pin`),
  unpinUser: (id: string) => api.post(`/admin/users/${id}/unpin`),
  unlockUser: (id: string) => api.post(`/admin/users/${id}/unlock`),
  clearFlag: (id: string) => api.post(`/admin/users/${id}/clear-flag`),

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
  sendAdminVerification: (email: string) => api.post("/admin/admins/send-verification", { email }, { _noToast: true } as any),
  verifyAdminEmail: (email: string, code: string) => api.post("/admin/admins/verify-email", { email, code }, { _noToast: true } as any),
  setupAdmin2FA: (email: string) => api.post("/admin/admins/setup-2fa", { email }, { _noToast: true } as any),
  verifyAdmin2FA: (email: string, token: string) => api.post("/admin/admins/verify-2fa", { email, token }, { _noToast: true } as any),
  createAdmin: (data: any) => api.post("/admin/admins/create", data, { _noToast: true } as any),
  listAdmins: () => api.get("/admin/admins"),
  updateAdmin: (id: string, data: { firstName?: string; lastName?: string; permissions?: string[] }) => api.put(`/admin/admins/${id}`, data),
  updateAdminPermissions: (id: string, permissions: string[]) => api.put(`/admin/admins/${id}/permissions`, { permissions }),
  deleteAdmin: (id: string, data?: { password: string; twoFactorCode?: string }) => api.delete(`/admin/admins/${id}`, { data }),
  getAvailablePermissions: () => api.get("/admin/admins/permissions/list"),

  // Admin Messaging & Notifications
  sendUserMessage: (userId: string, content: string) => api.post(`/admin/users/${userId}/message`, { content }),
  notifyUser: (userId: string, title: string, body: string) => api.post(`/admin/users/${userId}/notify`, { title, body }),
  broadcastNotification: (title: string, body: string, gender?: string) => api.post("/admin/notifications/broadcast", { title, body, gender }),

  // Legacy (existing)
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (settings: Record<string, unknown>) => api.put("/admin/settings", settings),
  getActivities: (params?: Record<string, unknown>) => api.get("/admin/activities", { params }),
  getVerifications: (status?: string) => api.get("/verification/admin/all", { params: status ? { status } : {} }),
  approveVerification: (id: string, adminNote?: string) => api.post(`/verification/${id}/approve`, { adminNote }),
  rejectVerification: (id: string, adminNote?: string) => api.post(`/verification/${id}/reject`, { adminNote }),
  markVerificationViewed: () => api.post("/verification/mark-viewed"),
  getComplaints: (status?: string) => api.get("/complaints/admin/all", { params: status ? { status } : {} }),
  respondToComplaint: (id: string, adminResponse: string, status?: string) => api.post(`/complaints/${id}/respond`, { adminResponse, status }),
  closeComplaint: (id: string, adminResponse?: string) => api.post(`/complaints/${id}/close`, { adminResponse }),
  reopenComplaint: (id: string) => api.post(`/complaints/${id}/reopen`),
  markComplaintViewed: (ids: string[]) => api.post("/complaints/mark-viewed", { ids }),
  getReports: (status?: string) => api.get("/reports/admin/all", { params: status ? { status } : {} }),
  updateReportStatus: (id: string, status: string, adminNote?: string) => api.put(`/reports/${id}/status`, { status, adminNote }),
  dismissReport: (id: string, adminNote?: string) => api.post(`/reports/${id}/dismiss`, { adminNote }),
  markReportViewed: () => api.post("/reports/mark-viewed"),
  getSubscriptions: (params?: Record<string, unknown>) => api.get("/subscriptions/admin/subscriptions", { params }),
  getPayments: (params?: Record<string, unknown>) => api.get("/subscriptions/admin/payments", { params }),
  getRevenueStats: () => api.get("/subscriptions/admin/revenue", { _noToast: true } as any),
  updateSubscription: (id: string, data: Record<string, unknown>) => api.put(`/subscriptions/admin/subscriptions/${id}`, data),
  cancelSubscription: (id: string) => api.delete(`/subscriptions/admin/subscriptions/${id}`),

  // Payments (manual verification queue)
  getAdminPayments: (params?: Record<string, unknown>) => api.get("/payments/admin/payments", { params }),
  getPaymentStats: (params?: Record<string, unknown>) => api.get("/payments/admin/payments/stats", { params, _noToast: true } as any),
  getRenewalReminders: (params?: Record<string, unknown>) => api.get("/payments/admin/payments/renewals", { params }),
  approvePayment: (id: string, adminNote?: string) => api.post(`/payments/admin/payments/${id}/approve`, { adminNote }),
  rejectPayment: (id: string, adminNote?: string) => api.post(`/payments/admin/payments/${id}/reject`, { adminNote }),
  reactivatePayment: (id: string) => api.post(`/payments/admin/payments/${id}/reactivate`),
  verifyTransaction: (ref: string) => api.get(`/payments/admin/verify-transaction/${encodeURIComponent(ref)}`),

  // Membership Plans
  getMembershipPlans: (activeOnly?: boolean) => api.get("/membership/membership-plans", { params: activeOnly ? { activeOnly: "true" } : {} }),
  createMembershipPlan: (data: any) => api.post("/membership/membership-plans", data),
  updateMembershipPlan: (id: string, data: any) => api.put(`/membership/membership-plans/${id}`, data),
  deleteMembershipPlan: (id: string) => api.delete(`/membership/membership-plans/${id}`),

  // Contact Credit Packages
  getCreditPackages: (activeOnly?: boolean) => api.get("/membership/credit-packages", { params: activeOnly ? { activeOnly: "true" } : {} }),
  createCreditPackage: (data: any) => api.post("/membership/credit-packages", data),
  updateCreditPackage: (id: string, data: any) => api.put(`/membership/credit-packages/${id}`, data),
  deleteCreditPackage: (id: string) => api.delete(`/membership/credit-packages/${id}`),

  // Payment Methods
  getPaymentMethods: (activeOnly?: boolean) => api.get("/membership/payment-methods", { params: activeOnly ? { activeOnly: "true" } : {} }),
  createPaymentMethod: (data: any) => api.post("/membership/payment-methods", data),
  updatePaymentMethod: (id: string, data: any) => api.put(`/membership/payment-methods/${id}`, data),
  deletePaymentMethod: (id: string) => api.delete(`/membership/payment-methods/${id}`),
};
