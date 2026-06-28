const bcrypt = require("bcryptjs");
const { authenticator } = require("otplib");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logAudit } = require("../utils/auditLogger");

// Store verification codes in memory (for demo; use Redis in production)
const verificationCodes = new Map();

// === SEND EMAIL VERIFICATION ===
exports.sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`[DEV] Verification code for ${email}: ${code}`);

    res.json({ message: "Verification code sent", devCode: code });
  } catch (error) {
    res.status(500).json({ error: "Failed to send verification" });
  }
};

// === VERIFY EMAIL CODE ===
exports.verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const stored = verificationCodes.get(email);
    if (!stored) return res.status(400).json({ error: "No code sent to this email" });
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: "Code expired" });
    }
    if (stored.code !== code) return res.status(400).json({ error: "Invalid code" });

    verificationCodes.set(email, { ...stored, emailVerified: true });
    res.json({ message: "Email verified", verified: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify code" });
  }
};

// === SETUP GOOGLE AUTHENTICATOR ===
exports.setupGoogleAuth = async (req, res) => {
  try {
    const { email } = req.body;
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(email, "Ethio Nikah Admin", secret);

    // Store temporary secret for confirmation
    const stored = verificationCodes.get(email) || {};
    verificationCodes.set(email, { ...stored, tempGoogleSecret: secret });

    res.json({ secret, uri, message: "Scan QR code with Google Authenticator" });
  } catch (error) {
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
};

// === VERIFY GOOGLE AUTH CODE ===
exports.verifyGoogleAuth = async (req, res) => {
  try {
    const { email, token } = req.body;
    const stored = verificationCodes.get(email);
    if (!stored?.tempGoogleSecret) return res.status(400).json({ error: "2FA not initialized" });

    const isValid = authenticator.verify({ token, secret: stored.tempGoogleSecret });
    if (!isValid) return res.status(400).json({ error: "Invalid authenticator code" });

    verificationCodes.set(email, { ...stored, googleVerified: true });
    res.json({ message: "2FA verified", verified: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
};

// === CREATE ADMIN ===
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, permissions } = req.body;

    const stored = verificationCodes.get(email);
    if (!stored?.emailVerified) return res.status(400).json({ error: "Email not verified" });
    if (!stored?.googleVerified) return res.status(400).json({ error: "2FA not verified" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        phone: `admin_${Date.now()}`,
        passwordHash,
        firstName,
        lastName,
        gender: "male",
        dateOfBirth: new Date("1990-01-01"),
        role: "admin",
        adminRole: "admin",
        googleAuthSecret: stored.tempGoogleSecret,
        isEmailVerified: true,
      },
    });

    // Grant specified permissions
    if (permissions?.length > 0) {
      await prisma.adminPermission.createMany({
        data: permissions.map((p) => ({ adminId: user.id, permission: p })),
        skipDuplicates: true,
      });
    }

    verificationCodes.delete(email);

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
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: {
        id: true, email: true, firstName: true, lastName: true, adminRole: true,
        isActive: true, createdAt: true, lastLoginAt: true, googleAuthSecret: true,
        _count: { select: { permissions: true, auditLogs: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ admins });
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
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== "admin") return res.status(404).json({ error: "Admin not found" });
    if (target.adminRole === "super_admin") return res.status(403).json({ error: "Cannot delete super admin" });
    if (target.id === req.user.userId) return res.status(400).json({ error: "Cannot delete yourself" });

    await prisma.user.delete({ where: { id } });

    await logAudit({
      adminId: req.user.userId,
      action: "delete_admin",
      resource: "admin",
      resourceId: id,
    });

    res.json({ message: "Admin deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete admin" });
  }
};

// === GET AVAILABLE PERMISSIONS ===
exports.getAvailablePermissions = async (req, res) => {
  const { PERMISSIONS } = require("../middleware/rbac");
  const groups = [
    { group: "Users", permissions: ["users.view", "users.edit", "users.suspend", "users.ban", "users.delete", "users.verify", "users.reset_password", "users.restrict_chat"] },
    { group: "Verifications", permissions: ["verifications.view", "verifications.approve", "verifications.reject"] },
    { group: "Content", permissions: ["content.review", "content.dismiss", "content.delete"] },
    { group: "Reports & Complaints", permissions: ["reports.view", "reports.manage", "complaints.view", "complaints.respond"] },
    { group: "Analytics", permissions: ["analytics.view", "analytics.export"] },
    { group: "Settings", permissions: ["settings.view", "settings.edit", "settings.feature_toggles"] },
    { group: "Security", permissions: ["security.audit_logs", "security.gdpr"] },
    { group: "Community", permissions: ["community.content_queue", "community.compliance", "community.wali"] },
    { group: "Growth", permissions: ["growth.analytics", "growth.funnel", "growth.retention"] },
    { group: "Integrations", permissions: ["integrations.view", "integrations.edit", "integrations.affiliates", "integrations.promotions"] },
    { group: "Notifications", permissions: ["notifications.templates", "notifications.send"] },
  ];
  res.json({ groups });
};
