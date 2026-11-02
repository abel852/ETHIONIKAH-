const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const { generateAccessToken, generateRefreshToken, verifyAccessToken } = require("../config/auth");

const TWO_FACTOR_LOCK_DURATION = 6 * 60 * 60 * 1000;
const TEMP_TOKEN_EXPIRY = "5m";
const BACKUP_CODE_COUNT = 10;

const generateTempToken = (userId) => jwt.sign({ userId, purpose: "2fa" }, process.env.JWT_SECRET, { expiresIn: TEMP_TOKEN_EXPIRY });
const verifyTempToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase().match(/.{1,4}/g).join("-"));
  }
  return codes;
}

function hashBackupCodes(codes) {
  return codes.map((c) => bcrypt.hashSync(c, 6));
}

async function send2FAAlert(user, action) {
  try {
    const { send2FAAlertEmail } = require("../utils/email");
    await send2FAAlertEmail(user.email, user.firstName, action);
  } catch (e) {
    console.error(`[EMAIL] 2FA alert email failed for ${user.email}:`, e.message);
  }
}

exports.checkLockout = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { twoFactorPermanentlyLocked: true, twoFactorLockedUntil: true } });
    if (!user) return res.json({ locked: false });
    const now = new Date();
    if (user.twoFactorPermanentlyLocked) return res.json({ locked: true, permanent: true, message: "Account locked. Contact admin via Help & Support." });
    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > now) return res.json({ locked: true, permanent: false, message: "Account temporarily locked. Try again later." });
    res.json({ locked: false });
  } catch (error) {
    res.status(500).json({ error: "Failed to check lockout status" });
  }
};

exports.enable2FA = async (req, res) => {
  try {
    const { force, password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { email: true, googleAuthSecret: true, passwordHash: true } });

    if (user?.googleAuthSecret && !force) {
      const existingSecret = speakeasy.otpauthURL({ secret: user.googleAuthSecret, label: "Ethio-Nikah", issuer: "Ethio-Nikah", encoding: "base32" });
      const qrDataUrl = await qrcode.toDataURL(existingSecret);
      return res.json({ secret: user.googleAuthSecret, qrCode: qrDataUrl, existing: true });
    }

    if (force) {
      if (!password) return res.status(400).json({ error: "Password is required to generate a new key" });
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) return res.status(401).json({ error: "Invalid password" });
    }

    const secret = speakeasy.generateSecret({ name: "Ethio-Nikah", issuer: "Ethio-Nikah" });
    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrDataUrl, existing: false });
  } catch (error) {
    console.error("Enable 2FA error:", error);
    res.status(500).json({ error: "Failed to generate 2FA setup" });
  }
};

exports.confirm2FA = async (req, res) => {
  try {
    const { secret, token } = req.body;
    if (!secret || !token) return res.status(400).json({ error: "Secret and token are required" });

    const verified = speakeasy.totp.verify({ secret, encoding: "base32", token, window: 1 });
    if (!verified) return res.status(400).json({ error: "Invalid code. Try again." });

    const codes = generateBackupCodes();
    const hashed = hashBackupCodes(codes);

    // Check if user is super admin — they are exempt from 2FA requirement, so don't invalidate session
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { adminRole: true },
    });

    const isSuperAdmin = user?.adminRole === "super_admin";

    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        googleAuthSecret: secret,
        twoFactorEnabled: true,
        twoFactorFailedAttempts: 0,
        twoFactorLockedUntil: null,
        twoFactorPermanentlyLocked: false,
        backupCodes: JSON.stringify(hashed),
        usedBackupCodes: JSON.stringify([]),
        // Only increment tokenVersion for regular admins (required 2FA)
        // Super admins have optional 2FA, so don't invalidate their session
        ...(isSuperAdmin ? {} : { tokenVersion: { increment: 1 } }),
      },
    });

    if (!isSuperAdmin) {
      try { require("../middleware/auth").invalidateAuthCache(req.user.userId); } catch {}
    }

    const userData = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { email: true, firstName: true } });
    send2FAAlert(userData, "enabled");

    res.json({ message: "Two-factor authentication enabled", backupCodes: codes });
  } catch (error) {
    console.error("Confirm 2FA error:", error);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body;
    if (!password || !token) return res.status(400).json({ error: "Password and authenticator code are required" });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.passwordHash) return res.status(400).json({ error: "No password set on this account" });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    if (!user.googleAuthSecret) return res.status(400).json({ error: "No 2FA secret configured" });

    const validToken = speakeasy.totp.verify({ secret: user.googleAuthSecret, encoding: "base32", token, window: 1 });
    if (!validToken) return res.status(400).json({ error: "Invalid authenticator code. Use a live code from your authenticator app." });

    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorFailedAttempts: 0,
        twoFactorLockedUntil: null,
        twoFactorPermanentlyLocked: false,
        tokenVersion: { increment: 1 },
      },
    });

    send2FAAlert(user, "disabled");
    res.json({ message: "Two-factor authentication disabled" });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
};

exports.get2FAStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { twoFactorEnabled: true, googleAuthSecret: true, backupCodes: true },
    });
    const backupCodeCount = user?.backupCodes ? JSON.parse(user.backupCodes).length : 0;
    res.json({ enabled: !!user?.twoFactorEnabled, hasSecret: !!user?.googleAuthSecret, backupCodeCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to get 2FA status" });
  }
};

exports.verify2FALogin = async (req, res) => {
  try {
    const { tempToken, token, trustDevice } = req.body;
    if (!tempToken || !token) return res.status(400).json({ error: "Temp token and authenticator code are required" });

    let decoded;
    try { decoded = verifyTempToken(tempToken); } catch { return res.status(400).json({ error: "Session expired. Please login again." }); }
    if (decoded.purpose !== "2fa") return res.status(400).json({ error: "Invalid token purpose" });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true, verification: true },
    });

    if (!user) return res.status(401).json({ error: "User not found" });
    if (!user.twoFactorEnabled) return res.status(400).json({ error: "2FA is not enabled for this account" });

    const now = new Date();
    if (user.twoFactorPermanentlyLocked) return res.status(403).json({ error: "Account locked. Contact admin via Help & Support." });
    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > now) return res.status(403).json({ error: "Account temporarily locked. Try again later." });

    let verified = false;
    let wasUsedCode = false;
    if (user.googleAuthSecret) verified = speakeasy.totp.verify({ secret: user.googleAuthSecret, encoding: "base32", token, window: 1 });

    if (!verified && user.backupCodes) {
      const codes = JSON.parse(user.backupCodes);
      const idx = codes.findIndex((h) => bcrypt.compareSync(token, h));
      if (idx !== -1) {
        verified = true;
        const usedHash = codes.splice(idx, 1)[0];
        const usedCodes = user.usedBackupCodes ? JSON.parse(user.usedBackupCodes) : [];
        usedCodes.push(usedHash);
        await prisma.user.update({ where: { id: user.id }, data: { backupCodes: JSON.stringify(codes), usedBackupCodes: JSON.stringify(usedCodes) } });
      } else if (user.usedBackupCodes) {
        const usedCodes = JSON.parse(user.usedBackupCodes);
        wasUsedCode = usedCodes.some((h) => bcrypt.compareSync(token, h));
      }
    }

    if (!verified) {
      const errorMsg = wasUsedCode ? "This recovery code has already been used" : "Invalid code";
      const newAttempts = user.twoFactorFailedAttempts + 1;

      if (user.twoFactorLockedUntil && user.twoFactorLockedUntil <= now) {
        if (newAttempts >= 2) {
          await prisma.user.update({ where: { id: user.id }, data: { twoFactorFailedAttempts: newAttempts, twoFactorPermanentlyLocked: true, twoFactorLockedUntil: null } });
          return res.status(403).json({ error: "Account locked. Contact admin via Help & Support." });
        }
        await prisma.user.update({ where: { id: user.id }, data: { twoFactorFailedAttempts: newAttempts } });
        return res.status(400).json({ error: errorMsg, attemptsRemaining: 2 - newAttempts });
      }

      if (newAttempts >= 4) {
        await prisma.user.update({ where: { id: user.id }, data: { twoFactorFailedAttempts: newAttempts, twoFactorLockedUntil: new Date(Date.now() + TWO_FACTOR_LOCK_DURATION) } });
        return res.status(403).json({ error: "Too many failed attempts. Account locked for 6 hours." });
      }

      await prisma.user.update({ where: { id: user.id }, data: { twoFactorFailedAttempts: newAttempts } });
      return res.status(400).json({ error: errorMsg, attemptsRemaining: 4 - newAttempts, needsCaptcha: newAttempts >= 2 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now, twoFactorFailedAttempts: 0, twoFactorLockedUntil: null, twoFactorPermanentlyLocked: false, resetToken: null, resetTokenExpiry: null },
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, adminRole: user.adminRole, tokenVersion: user.tokenVersion });
    const refreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });
    const { passwordHash, ...userWithoutPassword } = user;

    let deviceToken;
    if (trustDevice) {
      deviceToken = jwt.sign(
        { userId: user.id, purpose: "trusted_device" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
    }

    if (user.role === "admin") {
      const perms = await prisma.adminPermission.findMany({ where: { adminId: user.id } });
      userWithoutPassword.permissions = perms.map((p) => p.permission);
      const { logAudit } = require("../utils/auditLogger");
      logAudit({ actorId: user.id, actorType: "ADMIN", action: "admin_login", resource: "auth", details: { email: user.email, method: "2fa" } });
    }

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      deviceToken,
    });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    res.status(500).json({ error: "2FA verification failed" });
  }
};

exports.getRecoveryCodes = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { backupCodes: true },
    });
    if (!user?.backupCodes) return res.json({ codes: [] });
    const codes = JSON.parse(user.backupCodes);
    const remaining = codes.length;
    const masked = codes.map((h, i) => ({
      index: i,
      used: false,
      hint: `****-****-****-${h.slice(-4)}`,
    }));
    res.json({ codes: masked, count: remaining });
  } catch (error) {
    res.status(500).json({ error: "Failed to get recovery codes" });
  }
};

exports.regenerateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    const codes = generateBackupCodes();
    const hashed = hashBackupCodes(codes);
    await prisma.user.update({ where: { id: req.user.userId }, data: { backupCodes: JSON.stringify(hashed), usedBackupCodes: JSON.stringify([]) } });

    send2FAAlert(user, "regenerated");
    res.json({ backupCodes: codes });
  } catch (error) {
    res.status(500).json({ error: "Failed to regenerate backup codes" });
  }
};

exports.trustedDevice = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required to trust a device" });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { passwordHash: true } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    const deviceToken = jwt.sign(
      { userId: req.user.userId, purpose: "trusted_device" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({ deviceToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate device token" });
  }
};

exports.adminReset2FA = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await prisma.user.update({
      where: { id },
      data: {
        googleAuthSecret: null,
        twoFactorEnabled: false,
        twoFactorFailedAttempts: 0,
        twoFactorLockedUntil: null,
        twoFactorPermanentlyLocked: false,
        backupCodes: null,
        usedBackupCodes: null,
        tokenVersion: { increment: 1 },
      },
    });

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "reset_2fa", resource: "user", resourceId: id, details: { email: user.email } });

    res.json({ message: "2FA reset for user" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset 2FA" });
  }
};
