const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PERMISSIONS = {
  // Overview
  "overview.dashboard": "View admin dashboard",
  "overview.activity": "View activity timeline",
  // User Management
  "users.view": "View user profiles and details",
  "users.edit": "Edit user profiles",
  "users.suspend": "Suspend or activate users",
  "users.ban": "Ban users permanently",
  "users.delete": "Delete users",
  "users.verify": "Verify user identities",
  "users.reset_password": "Reset user passwords",
  "users.restrict_chat": "Restrict user chat capabilities",
  "users.restore": "Restore deleted users",
  // Verifications
  "verifications.view": "View verification details",
  "verifications.approve": "Approve verification requests",
  "verifications.reject": "Reject verification requests",
  // Admin Management
  "admins.view": "View admin list",
  "admins.manage": "Create, edit, and delete admins",
  // Recycle Bin
  "recycle_bin.view": "View recycle bin",
  "recycle_bin.restore": "Restore deleted items",
  "recycle_bin.purge": "Permanently delete items",
  // Moderation — Complaints
  "complaints.view": "View complaints",
  "complaints.respond": "Respond to complaints",
  "complaints.pin": "Pin priority complaints",
  // Moderation — Reports
  "reports.view": "View reports",
  "reports.manage": "Manage and resolve reports",
  "reports.pin": "Pin priority reports",
  // Revenue
  "payments.view": "View payments",
  "payments.refund": "Issue refunds",
  "membership_plans.view": "View membership plans",
  "membership_plans.edit": "Edit membership plans",
  "payment_methods.view": "View payment methods",
  "payment_methods.edit": "Edit payment methods",
  "analytics.view": "View analytics and dashboard",
  "analytics.export": "Export analytics data",
  // Security
  "security.view": "View security panel",
  "security.audit_logs": "View audit logs",
  "security.gdpr": "Manage GDPR/privacy controls",
  // Matchmaking
  "matchmaking.view": "View matchmaking settings",
  "matchmaking.edit": "Edit matchmaking algorithms",
  // AI & Automation
  "ai.fraud": "Manage fraud detection",
  "ai.matchmaking": "Tweak matchmaking algorithms",
  "ai.moderation": "Manage automated moderation",
  "ai.recommendations": "Oversee recommendation engine",
  // System
  "settings.view": "View system settings",
  "settings.edit": "Modify system settings",
  "settings.feature_toggles": "Manage feature toggles",
  "backup.view": "View backups",
  "backup.create": "Create backups",
  "backup.restore": "Restore backups",
  "backup.delete": "Delete backups",
  // Notifications
  "notifications.templates": "Manage notification templates",
  "notifications.send": "Send system notifications",
  // Books
  "books.view": "View books library",
  "books.manage": "Upload, edit, and delete books",
};

async function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      const adminId = req.user.userId || req.user.id;
      const perm = await prisma.adminPermission.findUnique({
        where: { adminId_permission: { adminId, permission } },
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
