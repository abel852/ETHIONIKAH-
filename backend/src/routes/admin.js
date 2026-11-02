const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminController");
const twoFactorCtrl = require("../controllers/twoFactorController");
const { authenticate, authorize, requireAdmin2FA } = require("../middleware/auth");
const { cacheResponse } = require("../middleware/cache");
const { requirePermission } = require("../middleware/rbac");
const auth = [authenticate, authorize("admin"), requireAdmin2FA];

// Users
router.post("/users/mark-viewed", ...auth, requirePermission("users.view"), ctrl.markUsersViewed);
router.get("/users", ...auth, requirePermission("users.view"), ctrl.getAllUsers);
router.get("/users/:id", ...auth, requirePermission("users.view"), ctrl.getUserById);
router.get("/users/:id/stats", ...auth, requirePermission("users.view"), ctrl.getUserStats);
router.post("/users/:id/suspend", ...auth, requirePermission(["users.suspend", "users.edit"]), ctrl.suspendUser);
router.post("/users/:id/activate", ...auth, requirePermission(["users.suspend", "users.edit"]), ctrl.activateUser);
router.delete("/users/:id", ...auth, requirePermission(["users.delete", "users.edit"]), ctrl.deleteUser);
router.post("/users/:id/reset-password", ...auth, requirePermission(["users.reset_password", "users.edit"]), ctrl.resetUserPassword);
router.post("/users/:id/restrict-chat", ...auth, requirePermission(["users.restrict_chat", "users.edit"]), ctrl.restrictUserChat);
router.post("/users/:id/ban", ...auth, requirePermission(["users.ban", "users.edit"]), ctrl.restrictUserBan);
router.post("/users/:id/unban", ...auth, requirePermission(["users.ban", "users.edit"]), ctrl.unbanUser);
router.post("/users/:id/remove-restriction", ...auth, requirePermission(["users.restrict_chat", "users.ban", "users.edit"]), ctrl.removeUserRestriction);
router.get("/users/:id/restrictions", ...auth, requirePermission("users.view"), ctrl.getUserRestrictions);
router.post("/users/:id/verify", ...auth, requirePermission(["users.verify", "users.edit"]), ctrl.verifyUser);
router.post("/users/:id/reject-verification", ...auth, requirePermission(["users.verify", "users.edit"]), ctrl.rejectUserVerification);
router.post("/users/:id/reset-2fa", ...auth, requirePermission(["users.reset_password", "users.edit"]), twoFactorCtrl.adminReset2FA);
router.post("/users/:id/mark-viewed", ...auth, requirePermission("users.view"), ctrl.markUsersViewed);

// Lockout Management
router.post("/users/:id/pin", ...auth, requirePermission(["users.edit", "users.view"]), ctrl.pinUser);
router.post("/users/:id/unpin", ...auth, requirePermission(["users.edit", "users.view"]), ctrl.unpinUser);
router.post("/users/:id/unlock", ...auth, requirePermission(["users.edit", "users.view"]), ctrl.unlockUser);
router.post("/users/:id/clear-flag", ...auth, requirePermission(["users.edit", "users.view"]), ctrl.clearFlag);

// Dashboard & Analytics
router.get("/dashboard", ...auth, cacheResponse(60), ctrl.getDashboardData);
router.get("/analytics", ...auth, cacheResponse(120), ctrl.getAnalytics);
router.get("/retention", ...auth, cacheResponse(120), ctrl.getRetentionMetrics);
router.get("/funnel", ...auth, cacheResponse(120), ctrl.getUserFunnel);
router.get("/engagement-heatmap", ...auth, cacheResponse(120), ctrl.getEngagementHeatmap);

// Security
router.get("/audit-logs", ...auth, ctrl.getAuditLogs);
router.get("/audit-actions", ...auth, ctrl.getAuditActions);
router.get("/suspicious-activity", ...auth, ctrl.getSuspiciousActivity);
router.get("/gdpr", ...auth, ctrl.getGDPRRequests);

// RBAC
router.get("/permissions", ...auth, cacheResponse(60), ctrl.getAdminPermissions);
router.post("/permissions", ...auth, ctrl.setAdminPermission);
router.delete("/permissions", ...auth, ctrl.removeAdminPermission);

// Feature Toggles
router.get("/feature-toggles", ...auth, cacheResponse(60), ctrl.getFeatureToggles);
router.put("/feature-toggles/:id", ...auth, ctrl.updateFeatureToggle);

// System Settings
router.get("/settings", ...auth, cacheResponse(60), ctrl.getSystemSettings);
router.put("/settings", ...auth, ctrl.updateSystemSettings);

// Content Flags
router.get("/content-flags", ...auth, ctrl.getContentFlags);
router.put("/content-flags/:id", ...auth, ctrl.reviewContentFlag);

// Affiliates & Promotions
router.get("/affiliates", ...auth, ctrl.getAffiliateReferrals);
router.get("/promotions", ...auth, ctrl.getPromotions);
router.post("/promotions", ...auth, ctrl.createPromotion);
router.put("/promotions/:id", ...auth, ctrl.updatePromotion);

// Notification Templates
router.get("/notification-templates", ...auth, ctrl.getNotificationTemplates);
router.put("/notification-templates/:id", ...auth, ctrl.updateNotificationTemplate);

// Compliance & Community
router.get("/compliance", ...auth, ctrl.getComplianceChecks);

// Activity Timeline
router.get("/activity-timeline", ...auth, cacheResponse(30), ctrl.getActivityTimeline);

// Seed defaults
router.post("/seed", ...auth, ctrl.seedDefaults);

// Activities
router.get("/activities", ...auth, cacheResponse(30), ctrl.getActivities);

// Admin Messaging
router.post("/users/:id/message", ...auth, requirePermission(["users.edit", "users.view"]), ctrl.sendUserMessage);
router.post("/users/:id/notify", ...auth, requirePermission(["users.edit", "users.view"]), ctrl.notifyUser);

// Broadcast
router.post("/notifications/broadcast", ...auth, requirePermission(["notifications.send", "users.edit"]), ctrl.broadcastNotification);

// 2FA Security Reminders
router.post("/notifications/2fa-reminders", ...auth, async (req, res) => {
  try {
    const { send2FAReminders } = require("../utils/cleanup");
    await send2FAReminders();
    res.json({ message: "2FA reminder notifications sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send 2FA reminders" });
  }
});

// Badge counts (no cache — always fresh)
router.get("/badge-counts", ...auth, ctrl.getBadgeCounts);

// Mark items as viewed (clears badge count)
router.post("/mark-viewed/:type", ...auth, ctrl.markAsViewed);

// Recycle bin (soft-deleted accounts)
router.get("/deleted-users", ...auth, requirePermission(["recycle_bin.view", "users.restore"]), ctrl.getDeletedUsers);
router.post("/deleted-users/:id/restore", ...auth, requirePermission(["recycle_bin.restore", "users.restore"]), ctrl.restoreDeletedUser);
router.post("/deleted-users/purge", ...auth, requirePermission(["recycle_bin.purge", "users.delete"]), ctrl.purgeDeletedUsers);

// R2 Storage monitoring
router.get("/storage-usage", ...auth, async (req, res) => {
  try {
    const { getStorageUsage, isR2Enabled } = require("../config/r2");
    if (!isR2Enabled()) return res.json({ enabled: false, message: "R2 storage not configured" });
    const usage = await getStorageUsage();
    res.json({ enabled: true, ...usage });
  } catch (error) {
    res.status(500).json({ error: "Failed to get storage usage" });
  }
});

// Manually trigger retention cleanup
router.post("/storage-cleanup", ...auth, async (req, res) => {
  try {
    const { runRetentionCleanup } = require("../utils/storageMonitor");
    await runRetentionCleanup();
    res.json({ message: "Retention cleanup completed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to run cleanup" });
  }
});

module.exports = router;
