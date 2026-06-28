const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminController");
const twoFactorCtrl = require("../controllers/twoFactorController");
const { authenticate, authorize } = require("../middleware/auth");
const auth = [authenticate, authorize("admin")];

// Users
router.get("/users", ...auth, ctrl.getAllUsers);
router.get("/users/:id", ...auth, ctrl.getUserById);
router.post("/users/:id/suspend", ...auth, ctrl.suspendUser);
router.post("/users/:id/activate", ...auth, ctrl.activateUser);
router.delete("/users/:id", ...auth, ctrl.deleteUser);
router.post("/users/:id/reset-password", ...auth, ctrl.resetUserPassword);
router.post("/users/:id/restrict-chat", ...auth, ctrl.restrictUserChat);
router.post("/users/:id/ban", ...auth, ctrl.restrictUserBan);
router.post("/users/:id/remove-restriction", ...auth, ctrl.removeUserRestriction);
router.get("/users/:id/restrictions", ...auth, ctrl.getUserRestrictions);
router.post("/users/:id/verify", ...auth, ctrl.verifyUser);
router.post("/users/:id/reset-2fa", ...auth, twoFactorCtrl.adminReset2FA);

// Dashboard & Analytics
router.get("/dashboard", ...auth, ctrl.getDashboardData);
router.get("/analytics", ...auth, ctrl.getAnalytics);
router.get("/retention", ...auth, ctrl.getRetentionMetrics);
router.get("/funnel", ...auth, ctrl.getUserFunnel);
router.get("/engagement-heatmap", ...auth, ctrl.getEngagementHeatmap);

// Security
router.get("/audit-logs", ...auth, ctrl.getAuditLogs);
router.get("/audit-actions", ...auth, ctrl.getAuditActions);
router.get("/suspicious-activity", ...auth, ctrl.getSuspiciousActivity);
router.get("/gdpr", ...auth, ctrl.getGDPRRequests);

// RBAC
router.get("/permissions", ...auth, ctrl.getAdminPermissions);
router.post("/permissions", ...auth, ctrl.setAdminPermission);
router.delete("/permissions", ...auth, ctrl.removeAdminPermission);

// Feature Toggles
router.get("/feature-toggles", ...auth, ctrl.getFeatureToggles);
router.put("/feature-toggles/:id", ...auth, ctrl.updateFeatureToggle);

// System Settings
router.get("/settings", ...auth, ctrl.getSystemSettings);
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
router.get("/activity-timeline", ...auth, ctrl.getActivityTimeline);

// Seed defaults
router.post("/seed", ...auth, ctrl.seedDefaults);

// Activities
router.get("/activities", ...auth, ctrl.getActivities);

module.exports = router;
