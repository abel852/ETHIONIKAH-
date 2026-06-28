const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PERMISSIONS = {
  // User management
  "users.view": "View user profiles and details",
  "users.edit": "Edit user profiles",
  "users.suspend": "Suspend or activate users",
  "users.ban": "Ban users permanently",
  "users.delete": "Delete users",
  "users.verify": "Verify user identities",
  "users.reset_password": "Reset user passwords",
  "users.restrict_chat": "Restrict user chat capabilities",
  // Content
  "content.review": "Review flagged content",
  "content.dismiss": "Dismiss content flags",
  "content.delete": "Delete inappropriate content",
  // Verifications
  "verifications.approve": "Approve verification requests",
  "verifications.reject": "Reject verification requests",
  "verifications.view": "View verification details",
  // Reports & Complaints
  "reports.view": "View reports",
  "reports.manage": "Manage and resolve reports",
  "complaints.view": "View complaints",
  "complaints.respond": "Respond to complaints",
  // Analytics
  "analytics.view": "View analytics and dashboard",
  "analytics.export": "Export analytics data",
  // Settings
  "settings.view": "View system settings",
  "settings.edit": "Modify system settings",
  "settings.feature_toggles": "Manage feature toggles",
  // Security
  "security.audit_logs": "View audit logs",
  "security.gdpr": "Manage GDPR/privacy controls",
  "security.rbac": "Manage admin permissions",
  // Content & Community
  "community.content_queue": "Manage content review queue",
  "community.compliance": "Manage cultural compliance checks",
  "community.wali": "Manage guardian/wali involvement",
  // Growth
  "growth.analytics": "View growth analytics",
  "growth.funnel": "View user funnel analytics",
  "growth.retention": "View retention metrics",
  // Integrations
  "integrations.view": "View integrations",
  "integrations.edit": "Modify integrations",
  "integrations.affiliates": "Manage affiliate/referral tracking",
  "integrations.promotions": "Manage promotions and discounts",
  // AI & Automation
  "ai.fraud": "Manage fraud detection",
  "ai.matchmaking": "Tweak matchmaking algorithms",
  "ai.moderation": "Manage automated moderation",
  "ai.recommendations": "Oversee recommendation engine",
  // Notifications
  "notifications.templates": "Manage notification templates",
  "notifications.send": "Send system notifications",
  // Localization
  "localization.manage": "Manage translations and localization",
  "localization.branding": "Manage theme and branding",
};

async function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const perm = await prisma.adminPermission.findUnique({
        where: { adminId_permission: { adminId: req.user.id, permission } },
      });
      if (!perm) {
        return res.status(403).json({ error: `Missing permission: ${permission}` });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Permission check failed" });
    }
  };
}

async function getPermissionsForAdmin(adminId) {
  const perms = await prisma.adminPermission.findMany({
    where: { adminId },
    select: { permission: true },
  });
  return perms.map((p) => p.permission);
}

module.exports = { PERMISSIONS, requirePermission, getPermissionsForAdmin };
