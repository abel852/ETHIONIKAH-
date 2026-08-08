const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminController");
const twoFactorCtrl = require("../controllers/twoFactorController");
const { authenticate, authorize, requireAdmin2FA } = require("../middleware/auth");
const { cacheResponse } = require("../middleware/cache");
const auth = [authenticate, authorize("admin"), requireAdmin2FA];

// Users
router.post("/users/mark-viewed", ...auth, ctrl.markUsersViewed);
router.get("/users", ...auth, ctrl.getAllUsers);
router.get("/users/:id", ...auth, ctrl.getUserById);
router.get("/users/:id/stats", ...auth, ctrl.getUserStats);
router.post("/users/:id/suspend", ...auth, ctrl.suspendUser);
router.post("/users/:id/activate", ...auth, ctrl.activateUser);
router.delete("/users/:id", ...auth, ctrl.deleteUser);
router.post("/users/:id/reset-password", ...auth, ctrl.resetUserPassword);
router.post("/users/:id/restrict-chat", ...auth, ctrl.restrictUserChat);
router.post("/users/:id/ban", ...auth, ctrl.restrictUserBan);
router.post("/users/:id/unban", ...auth, ctrl.unbanUser);
router.post("/users/:id/remove-restriction", ...auth, ctrl.removeUserRestriction);
router.get("/users/:id/restrictions", ...auth, ctrl.getUserRestrictions);
router.post("/users/:id/verify", ...auth, ctrl.verifyUser);
router.post("/users/:id/reject-verification", ...auth, ctrl.rejectUserVerification);
router.post("/users/:id/reset-2fa", ...auth, twoFactorCtrl.adminReset2FA);
router.post("/users/:id/mark-viewed", ...auth, ctrl.markUsersViewed);

// Lockout Management
router.post("/users/:id/pin", ...auth, ctrl.pinUser);
router.post("/users/:id/unpin", ...auth, ctrl.unpinUser);
router.post("/users/:id/unlock", ...auth, ctrl.unlockUser);
router.post("/users/:id/clear-flag", ...auth, ctrl.clearFlag);

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
router.post("/users/:id/message", ...auth, ctrl.sendUserMessage);
router.post("/users/:id/notify", ...auth, ctrl.notifyUser);

// Broadcast
router.post("/notifications/broadcast", ...auth, ctrl.broadcastNotification);

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
router.get("/deleted-users", ...auth, ctrl.getDeletedUsers);
router.post("/deleted-users/:id/restore", ...auth, ctrl.restoreDeletedUser);
router.post("/deleted-users/purge", ...auth, ctrl.purgeDeletedUsers);

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
