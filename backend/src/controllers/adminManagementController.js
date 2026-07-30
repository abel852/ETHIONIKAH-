const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { authenticator } = require("otplib");
const qrcode = require("qrcode");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logAudit } = require("../utils/auditLogger");

// ============================================================
// Verification code store — Redis-backed with in-memory fallback.
// Redis is used when REDIS_URL is set (multi-process safe).
// Falls back to a local Map in development / when Redis is down.
// ============================================================
const VERIFICATION_TTL = 10 * 60; // 10 minutes in seconds
const REDIS_PREFIX = "admin_verify:";

const fallbackStore = new Map();
let useRedis = !!process.env.REDIS_URL;

async function getStoreClient() {
  if (!useRedis) return null;
  try {
    const { getGeneralClient } = require("../config/redis");
    return await getGeneralClient();
  } catch {
    console.warn("[ADMIN] Redis unavailable, falling back to in-memory store");
    useRedis = false;
    return null;
  }
}

async function storeVerificationData(email, data) {
  const client = await getStoreClient();
  if (client) {
    await client.set(REDIS_PREFIX + email, JSON.stringify(data), { EX: VERIFICATION_TTL });
  } else {
    fallbackStore.set(email, { ...data, expiresAt: Date.now() + VERIFICATION_TTL * 1000 });
  }
}

async function getVerificationData(email) {
  const client = await getStoreClient();
  if (client) {
    const raw = await client.get(REDIS_PREFIX + email);
    return raw ? JSON.parse(raw) : null;
  } else {
    const stored = fallbackStore.get(email);
    if (!stored) return null;
    if (Date.now() > stored.expiresAt) {
      fallbackStore.delete(email);
      return null;
    }
    return stored;
  }
}

async function updateVerificationData(email, updates) {
  const existing = await getVerificationData(email);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  await storeVerificationData(email, merged);
  return merged;
}

async function deleteVerificationData(email) {
  const client = await getStoreClient();
  if (client) {
    await client.del(REDIS_PREFIX + email);
  } else {
    fallbackStore.delete(email);
  }
}

// === SEND EMAIL VERIFICATION ===
exports.sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const code = crypto.randomInt(100000, 1000000).toString();
    await storeVerificationData(email, { code, emailVerified: false, googleVerified: false });

    try {
      const { sendOtpEmail } = require("../utils/email");
      await sendOtpEmail(email, "there", code, "email");
    } catch (emailErr) {
      console.error("[EMAIL] Verification code email failed:", emailErr.message);
    }

    res.json({ message: "Verification code sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send verification" });
  }
};

// === VERIFY EMAIL CODE ===
exports.verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const stored = await getVerificationData(email);
    if (!stored) return res.status(400).json({ error: "No code sent to this email" });

    const attempts = (stored.attempts || 0) + 1;
    if (stored.code !== code) {
      if (attempts >= 5) {
        await deleteVerificationData(email);
        return res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
      }
      await updateVerificationData(email, { attempts });
      return res.status(400).json({ error: "Invalid code", attemptsRemaining: 5 - attempts });
    }

    await updateVerificationData(email, { emailVerified: true, attempts: 0 });
    res.json({ message: "Email verified", verified: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify code" });
  }
};

// === SETUP GOOGLE AUTHENTICATOR ===
exports.setupGoogleAuth = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(email, "Ethio Nikah", secret);

    const qrDataUrl = await qrcode.toDataURL(uri);

    // Store temporary secret for confirmation
    const stored = await getVerificationData(email) || {};
    await storeVerificationData(email, { ...stored, tempGoogleSecret: secret });

    res.json({ secret, qrCode: qrDataUrl, uri, message: "Scan QR code with Google Authenticator" });
  } catch (error) {
    console.error("[SETUP-2FA] Error:", error.message, error.stack);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
};

// === VERIFY GOOGLE AUTH CODE ===
exports.verifyGoogleAuth = async (req, res) => {
  try {
    const { email, token } = req.body;
    const stored = await getVerificationData(email);
    if (!stored?.tempGoogleSecret) return res.status(400).json({ error: "2FA not initialized" });

    const isValid = authenticator.verify({ token, secret: stored.tempGoogleSecret });
    if (!isValid) return res.status(400).json({ error: "Invalid authenticator code" });

    await updateVerificationData(email, { googleVerified: true });
    res.json({ message: "2FA verified", verified: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
};

// === CREATE ADMIN ===
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, permissions } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password)) return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
    if (!/[a-z]/.test(password)) return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
    if (!/[0-9]/.test(password)) return res.status(400).json({ error: "Password must contain at least one number" });
    if (!/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ error: "Password must contain at least one symbol (e.g. !@#$%)" });

    const stored = await getVerificationData(email);
    if (!stored?.emailVerified) return res.status(400).json({ error: "Email not verified" });

    // 2FA is mandatory for admin accounts
    const has2FA = stored?.googleVerified && stored?.tempGoogleSecret;
    if (!has2FA) {
      return res.status(400).json({ error: "Two-factor authentication (2FA) is required for admin accounts. Please set up Google Authenticator before creating an admin." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userData = {
      email,
      phone: `admin_${Date.now()}`,
      passwordHash,
      firstName,
      lastName,
      gender: "male",
      dateOfBirth: new Date("1990-01-01"),
      role: "admin",
      adminRole: "admin",
      isEmailVerified: true,
    };

    if (has2FA) {
      userData.googleAuthSecret = stored.tempGoogleSecret;
    }

    const user = await prisma.user.create({ data: userData });

    // Grant specified permissions
    if (permissions?.length > 0) {
      await prisma.adminPermission.createMany({
        data: permissions.map((p) => ({ adminId: user.id, permission: p })),
        skipDuplicates: true,
      });
    }

    await deleteVerificationData(email);

    await logAudit({
      adminId: req.user.userId,
      action: "create_admin",
      resource: "admin",
      resourceId: user.id,
      details: { email, permissions },
    });

    res.json({ message: "Admin created", admin: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, adminRole: user.adminRole } });
  } catch (error) {
    console.error("Create admin error:", error);
    if (error.code === "P2002") return res.status(400).json({ error: "Email already in use" });
    res.status(500).json({ error: "Failed to create admin" });
  }
};

// === LIST ALL ADMINS ===
exports.listAdmins = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: {
        id: true, email: true, firstName: true, lastName: true, adminRole: true,
        isActive: true, createdAt: true, lastLoginAt: true, twoFactorEnabled: true,
        permissions: { select: { permission: true } },
        _count: { select: { permissions: true, auditLogs: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const enriched = await Promise.all(admins.map(async (a) => {
      const recentLogs = await prisma.auditLog.findMany({
        where: { adminId: a.id, createdAt: { gte: thirtyDaysAgo } },
        select: { resource: true, resourceId: true, action: true },
      });

      // Also count verifications reviewed directly from the verification table
      const [verificationsReviewed, complaintsHandled, reportsHandled] = await Promise.all([
        prisma.verification.count({
          where: { adminId: a.id, reviewedAt: { gte: thirtyDaysAgo } },
        }),
        prisma.complaint.count({
          where: { adminId: a.id, updatedAt: { gte: thirtyDaysAgo } },
        }).catch(() => 0),
        prisma.report.count({
          where: { adminId: a.id, updatedAt: { gte: thirtyDaysAgo } },
        }).catch(() => 0),
      ]);

      // Collect distinct user IDs from audit logs
      const userActions = recentLogs.filter((l) =>
        ["user", "verification", "complaint", "report"].includes(l.resource) && l.resourceId
      );
      const distinctUsersFromLogs = new Set(userActions.map((l) => l.resourceId));

      // Also count verifications as users served (by userId)
      const verifications = await prisma.verification.findMany({
        where: { adminId: a.id, reviewedAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
      });
      verifications.forEach((v) => distinctUsersFromLogs.add(v.userId));

      return {
        ...a,
        stats30d: {
          actions: recentLogs.length + verificationsReviewed + complaintsHandled + reportsHandled,
          usersServed: distinctUsersFromLogs.size,
        },
      };
    }));

    res.json({ admins: enriched });
  } catch (error) {
    res.status(500).json({ error: "Failed to list admins" });
  }
};

// === UPDATE ADMIN PERMISSIONS ===
exports.updateAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== "admin") return res.status(404).json({ error: "Admin not found" });
    if (target.adminRole === "super_admin") return res.status(403).json({ error: "Cannot modify super admin" });

    await prisma.adminPermission.deleteMany({ where: { adminId: id } });
    if (permissions?.length > 0) {
      await prisma.adminPermission.createMany({
        data: permissions.map((p) => ({ adminId: id, permission: p })),
      });
    }

    await logAudit({
      adminId: req.user.userId,
      action: "update_admin_permissions",
      resource: "admin",
      resourceId: id,
      details: { permissions },
    });

    res.json({ message: "Permissions updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update permissions" });
  }
};

// === DELETE ADMIN ===
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, twoFactorCode } = req.body;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== "admin") return res.status(404).json({ error: "Admin not found" });
    if (target.adminRole === "super_admin") return res.status(403).json({ error: "Cannot delete super admin" });
    if (target.id === req.user.userId) return res.status(400).json({ error: "Cannot delete yourself" });

    // Verify super admin's password
    const superAdmin = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!superAdmin) return res.status(403).json({ error: "Super admin not found" });

    const isPasswordValid = await bcrypt.compare(password, superAdmin.passwordHash);
    if (!isPasswordValid) return res.status(403).json({ error: "Invalid super admin password" });

    // Verify 2FA if enabled
    if (superAdmin.googleAuthSecret) {
      if (!twoFactorCode) return res.status(400).json({ error: "2FA code required" });
      const isValid2FA = authenticator.verify({ token: twoFactorCode, secret: superAdmin.googleAuthSecret });
      if (!isValid2FA) return res.status(403).json({ error: "Invalid 2FA code" });
    }

    // Delete related records first (AuditLog has no cascade)
    await prisma.auditLog.deleteMany({ where: { adminId: id } });
    await prisma.adminPermission.deleteMany({ where: { adminId: id } });

    await prisma.user.delete({ where: { id } });

    await logAudit({
      adminId: req.user.userId,
      action: "delete_admin",
      resource: "admin",
      resourceId: id,
    });

    res.json({ message: "Admin deleted" });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ error: "Failed to delete admin" });
  }
};

// === UPDATE ADMIN ===
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, permissions } = req.body;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== "admin") return res.status(404).json({ error: "Admin not found" });
    if (target.adminRole === "super_admin" && req.user.userId !== id) return res.status(403).json({ error: "Cannot modify super admin" });

    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id }, data });
    }

    if (permissions !== undefined) {
      await prisma.adminPermission.deleteMany({ where: { adminId: id } });
      if (permissions.length > 0) {
        await prisma.adminPermission.createMany({
          data: permissions.map((p) => ({ adminId: id, permission: p })),
          skipDuplicates: true,
        });
      }
    }

    await logAudit({
      adminId: req.user.userId,
      action: "update_admin",
      resource: "admin",
      resourceId: id,
      details: { firstName, lastName, permissions },
    });

    res.json({ message: "Admin updated" });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
};

// === GET AVAILABLE PERMISSIONS ===
exports.getAvailablePermissions = async (req, res) => {
  const { PERMISSIONS } = require("../middleware/rbac");
  const groups = [
    { group: "Overview", permissions: ["overview.dashboard", "overview.activity"] },
    { group: "User Management", permissions: ["users.view", "users.edit", "users.suspend", "users.ban", "users.delete", "users.verify", "users.reset_password", "users.restrict_chat", "users.restore"] },
    { group: "Verifications", permissions: ["verifications.view", "verifications.approve", "verifications.reject"] },
    { group: "Admin Management", permissions: ["admins.view", "admins.manage"] },
    { group: "Recycle Bin", permissions: ["recycle_bin.view", "recycle_bin.restore", "recycle_bin.purge"] },
    { group: "Moderation", permissions: ["complaints.view", "complaints.respond", "complaints.pin", "reports.view", "reports.manage", "reports.pin"] },
    { group: "Revenue", permissions: ["payments.view", "payments.refund", "membership_plans.view", "membership_plans.edit", "payment_methods.view", "payment_methods.edit", "analytics.view", "analytics.export"] },
    { group: "Security", permissions: ["security.view", "security.audit_logs", "security.gdpr"] },
    { group: "Matchmaking", permissions: ["matchmaking.view", "matchmaking.edit"] },
    { group: "AI & Automation", permissions: ["ai.fraud", "ai.matchmaking", "ai.moderation", "ai.recommendations"] },
    { group: "System", permissions: ["settings.view", "settings.edit", "settings.feature_toggles", "backup.view", "backup.create", "backup.restore", "backup.delete"] },
    { group: "Books", permissions: ["books.view", "books.manage"] },
    { group: "Notifications", permissions: ["notifications.templates", "notifications.send"] },
  ];
  // Map permissions to their human-readable descriptions
  const groupsWithLabels = groups.map((g) => ({
    ...g,
    permissions: g.permissions.map((p) => ({
      key: p,
      label: PERMISSIONS[p] || p.replace(/_/g, " "),
    })),
  }));
  res.json({ groups: groupsWithLabels });
};
