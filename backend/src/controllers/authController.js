const { encrypt } = require("../utils/encryption");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const { generateAccessToken, generateRefreshToken } = require("../config/auth");
const { logAudit } = require("../utils/auditLogger");
const { checkLockout, recordFailedLogin, resetLockout, checkForgotPasswordEligibility, recordForgotPasswordUsage } = require("../middleware/lockout");

const register = async (req, res) => {
  try {
    const {
      email, phone, password, firstName, lastName, gender, dateOfBirth,
      nationality, country, city, height, weight, appearance, hasWali, waliName, waliPhone, waliRelation, waliEmail, maritalStatus, hasChildren, childrenCount, childrenCustody, childrenStatus,
      religiousCommitment, prayerHabits, quranReadingFrequency,
      islamicClassesAttendance, preferredReligiousCommitment,
      islamicTradition, islamicTraditionOther, islamicMatchPreference,
      educationLevel, occupation, employmentStatus, monthlyIncomeRange,
      reasonForJoining, desiredMarriageTimeline, childrenPreference,
      ethnicBackground, motherTongue, familyInvolvement,
      smokingHabits, khatUsage, exerciseHabits, livingPreference,
      selfDescription, qualities, interests,
      preferredAgeMin, preferredAgeMax, preferredMaritalStatus,
      preferredEducationLevel, preferredLocation, waliInvolvement,
      polygamyPreference, mahrExpectation, genderInteraction,
      hivStatus, stdStatus, stdDetails,
      hereditaryDiseases, hereditaryDetails,
      chronicConditions, chronicDetails,
      disabilities, disabilityDetails, dwarfismStatus, dwarfismDetails, otherConditions,
      shareWithMatches,
      hivMatchPreference, stdMatchPreference,
      hereditaryMatchPreference, healthMatchPreference,
      personalPreference,
    } = req.validatedBody;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        return res.status(400).json({
          error: "This email or phone is associated with a deleted account that has not been fully purged yet. Please contact support to restore it within 30 days.",
          code: "ACCOUNT_DELETED_PENDING_PURGE",
        });
      }
      return res.status(400).json({ error: "Email or phone already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const toArray = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    };

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        isEmailVerified: true,
        isPhoneVerified: true,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        tokenVersion: true,
        language: true,
      },
    });

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        nationality,
        country,
        city,
        height: height || null,
        weight,
        appearance,
        hasWali,
        waliName,
        waliPhone,
        waliRelation,
        maritalStatus: maritalStatus || "single_never",
        hasChildren,
        childrenCount,
        childrenCustody,
        childrenStatus,
        religiousCommitment,
        prayerHabits,
        quranReadingFrequency,
        islamicClassesAttendance,
        islamicTradition,
        islamicTraditionOther,
        islamicMatchPreference,
        educationLevel,
        occupation,
        employmentStatus,
        monthlyIncomeRange,
        reasonForJoining,
        desiredMarriageTimeline,
        childrenPreference,
        ethnicBackground,
        motherTongue,
        familyInvolvement,
        smokingHabits,
        khatUsage,
        exerciseHabits,
        livingPreference,
        personalPreference,
        selfDescription,
        qualities: toArray(qualities),
        interests: toArray(interests),
        isProfileComplete: true,
      },
    });

    // Create Wali record for female users who have a Wali
    if (gender === "female" && hasWali && hasWali.toLowerCase() === "yes" && waliName) {
      try {
        await prisma.wali.create({
          data: {
            femaleUserId: user.id,
            name: waliName,
            relationship: waliRelation || "OTHER",
            email: waliEmail || "",
            phone: waliPhone || "",
          },
        });
      } catch (waliErr) {
        console.error("Wali creation error (non-fatal):", waliErr);
      }
    }

    if (profile && (preferredAgeMin || preferredAgeMax || preferredMaritalStatus ||
        preferredEducationLevel || preferredLocation || waliInvolvement ||
        polygamyPreference || mahrExpectation || genderInteraction ||
        preferredReligiousCommitment)) {
      await prisma.spousePreference.create({
        data: {
          profileId: profile.id,
          preferredAgeMin: preferredAgeMin || 18,
          preferredAgeMax: preferredAgeMax || 120,
          preferredMaritalStatus: preferredMaritalStatus || "any",
          preferredEducationLevel: preferredEducationLevel || "any",
          preferredLocation: preferredLocation || "",
          waliInvolvement: waliInvolvement || "optional",
          polygamyPreference: polygamyPreference || "not_acceptable",
          mahrExpectation: mahrExpectation || "",
          genderInteraction: genderInteraction || "moderate",
          preferredReligiousCommitment: preferredReligiousCommitment || "any",
          islamicMatchPreference: islamicMatchPreference || "",
        },
      });
    }

    const hasHealth = hivStatus || stdStatus || hereditaryDiseases || chronicConditions || disabilities || otherConditions;
    if (profile && hasHealth) {
      try {
        const healthEncrypted = (v) => (v ? encrypt(v) : null);
        await prisma.healthInfo.create({
          data: {
            profileId: profile.id,
            hivStatus: healthEncrypted(hivStatus),
            stdStatus: healthEncrypted(stdStatus),
            stdDetails: healthEncrypted(stdDetails),
            hereditaryDiseases: healthEncrypted(hereditaryDiseases),
            hereditaryDetails: healthEncrypted(hereditaryDetails),
            chronicConditions: healthEncrypted(chronicConditions),
            chronicDetails: healthEncrypted(chronicDetails),
            disabilities: healthEncrypted(disabilities),
            disabilityDetails: healthEncrypted(disabilityDetails),
            dwarfismStatus: healthEncrypted(dwarfismStatus),
            dwarfismDetails: healthEncrypted(dwarfismDetails),
            otherConditions: healthEncrypted(otherConditions),
            shareWithMatches: shareWithMatches ?? false,
            hivMatchPreference: hivMatchPreference ?? "any",
            stdMatchPreference: stdMatchPreference ?? "any",
            hereditaryMatchPreference: hereditaryMatchPreference ?? "any",
            healthMatchPreference: healthMatchPreference ?? "any",
          },
        });
      } catch (healthErr) {
        console.error("HealthInfo creation error (non-fatal):", healthErr);
      }
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, adminRole: user.adminRole, tokenVersion: user.tokenVersion ?? 0 });
    const refreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion ?? 0 });

    // Welcome email disabled — SMTP delivery failures were causing bounce-back emails.
    // Re-enable once email infrastructure (ethionikah.com MX records) is properly configured.

    res.status(201).json({
      message: "Registration successful",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    const message = error?.meta?.cause || error?.message || "Registration failed";
    res.status(500).json({ error: message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    // Check progressive lockout before anything else
    const lockoutInfo = await checkLockout(email);
    if (lockoutInfo) {
      return res.status(429).json({
        error: lockoutInfo.message || "Something went wrong. Please try again later.",
        code: "ACCOUNT_LOCKED",
        lockout: lockoutInfo,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, verification: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.deletedAt || user.isDeleted) {
      const canRestore = new Date() - new Date(user.deletedAt) < 30 * 24 * 60 * 60 * 1000;
      return res.status(403).json({
        error: canRestore
          ? "Your account has been deleted. Contact support within 30 days if you wish to restore it."
          : "Your account has been permanently deleted and cannot be restored.",
        code: "ACCOUNT_DELETED",
        deletedAt: user.deletedAt,
        canRestore,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Record failed login — triggers progressive lockout
      const failInfo = await recordFailedLogin(email, ip);
      if (failInfo && failInfo.locked) {
        return res.status(429).json({
          error: failInfo.message || "Something went wrong. Please try again later.",
          code: "ACCOUNT_LOCKED",
          lockout: failInfo,
        });
      }
      // Not locked yet — tell user how many attempts remain
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
        attemptsRemaining: failInfo?.attemptsRemaining,
        lockoutLevel: failInfo?.lockoutLevel,
        message: failInfo?.message,
      });
    }

    // 2FA gate — if enabled, require authenticator/backup code before issuing tokens
    if (user.twoFactorEnabled) {
      // Trusted device skips 2FA
      const deviceToken = req.headers["x-trusted-device"] || req.body.deviceToken;
      if (deviceToken) {
        try {
          const d = jwt.verify(deviceToken, process.env.JWT_SECRET);
          if (d.purpose === "trusted_device" && d.userId === user.id) return finishLogin();
        } catch {}
      }
      const tempToken = jwt.sign({ userId: user.id, purpose: "2fa" }, process.env.JWT_SECRET, { expiresIn: "5m" });
      return res.json({
        requiresTwoFactor: true,
        tempToken,
        message: "Enter the code from your authenticator app or a backup code",
      });
    }

    return finishLogin();

    async function finishLogin() {
      user.lastLoginAt = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), twoFactorFailedAttempts: 0 },
      });
      // Reset progressive lockout on successful login
      await resetLockout(user.id);

      const accessToken = generateAccessToken({ userId: user.id, role: user.role, adminRole: user.adminRole, tokenVersion: user.tokenVersion });
      const refreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

      const { passwordHash, ...userWithoutPassword } = user;

      if (user.role === "admin") {
        const perms = await prisma.adminPermission.findMany({ where: { adminId: user.id } });
        userWithoutPassword.permissions = perms.map((p) => p.permission);
        logAudit({ actorId: user.id, actorType: "ADMIN", action: "admin_login", resource: "auth", details: { email: user.email } });
      }

      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

const loginWithPhone = async (req, res) => {
  try {
    let { phone, password } = req.body;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    // Normalize Ethiopian phone: 09XXXXXXXXX → +2519XXXXXXXXX
    let normalizedPhone = phone.replace(/[\s\-()]/g, "");
    if (normalizedPhone.startsWith("09")) normalizedPhone = "+2519" + normalizedPhone.slice(2);
    else if (normalizedPhone.startsWith("9") && normalizedPhone.length === 9) normalizedPhone = "+251" + normalizedPhone;

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: { profile: true, verification: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.deletedAt || user.isDeleted) {
      const canRestore = new Date() - new Date(user.deletedAt) < 30 * 24 * 60 * 60 * 1000;
      return res.status(403).json({
        error: canRestore
          ? "Your account has been deleted. Contact support within 30 days if you wish to restore it."
          : "Your account has been permanently deleted and cannot be restored.",
        code: "ACCOUNT_DELETED",
        deletedAt: user.deletedAt,
        canRestore,
      });
    }

    // Check progressive lockout before password check
    const lockoutInfo = await checkLockout(user.email);
    if (lockoutInfo) {
      return res.status(429).json({
        error: lockoutInfo.message || "Something went wrong. Please try again later.",
        code: "ACCOUNT_LOCKED",
        lockout: lockoutInfo,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      const failInfo = await recordFailedLogin(user.email, ip);
      if (failInfo && failInfo.locked) {
        return res.status(429).json({
          error: failInfo.message || "Something went wrong. Please try again later.",
          code: "ACCOUNT_LOCKED",
          lockout: failInfo,
        });
      }
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
        attemptsRemaining: failInfo?.attemptsRemaining,
        lockoutLevel: failInfo?.lockoutLevel,
        message: failInfo?.message,
      });
    }

    // 2FA gate — if enabled, require authenticator/backup code before issuing tokens
    if (user.twoFactorEnabled) {
      const deviceToken = req.headers["x-trusted-device"] || req.body.deviceToken;
      if (deviceToken) {
        try {
          const d = jwt.verify(deviceToken, process.env.JWT_SECRET);
          if (d.purpose === "trusted_device" && d.userId === user.id) return finishLogin();
        } catch {}
      }
      const tempToken = jwt.sign({ userId: user.id, purpose: "2fa" }, process.env.JWT_SECRET, { expiresIn: "5m" });
      return res.json({
        requiresTwoFactor: true,
        tempToken,
        message: "Enter the code from your authenticator app or a backup code",
      });
    }

    return finishLogin();

    async function finishLogin() {
      await resetLockout(user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), twoFactorFailedAttempts: 0 },
      });

      const accessToken = generateAccessToken({ userId: user.id, role: user.role, adminRole: user.adminRole, tokenVersion: user.tokenVersion });
      const refreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

      const { passwordHash, ...userWithoutPassword } = user;

      if (user.role === "admin") {
        const perms = await prisma.adminPermission.findMany({ where: { adminId: user.id } });
        userWithoutPassword.permissions = perms.map((p) => p.permission);
        logAudit({ actorId: user.id, actorType: "ADMIN", action: "admin_login", resource: "auth", details: { phone: user.phone } });
      }

      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    }
  } catch (error) {
    console.error("Phone login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const { verifyRefreshToken } = require("../config/auth");
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, adminRole: true, isActive: true, tokenVersion: true, deletedAt: true, isDeleted: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (user.deletedAt || user.isDeleted) {
      return res.status(403).json({ error: "Account has been deleted", code: "ACCOUNT_DELETED" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: "Account has been suspended" });
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: "Session invalidated. Please login again." });
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role, adminRole: user.adminRole, tokenVersion: user.tokenVersion });
    const newRefreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        username: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        adminRole: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        isMarried: true,
        twoFactorEnabled: true,
        language: true,
        lastLoginAt: true,
        createdAt: true,
        profile: true,
        verification: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "active", endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    user.isPremium = !!activeSubscription;
    user.membershipPlan = activeSubscription?.planType || null;
    user.membershipExpiry = activeSubscription?.endDate || null;

    if (user.profile) {
      user.photos = user.profile.photos;
    }

    // Include permissions for admin users
    if (user.role === "admin") {
      const perms = await prisma.adminPermission.findMany({ where: { adminId: user.id } });
      user.permissions = perms.map((p) => p.permission);
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error?.message, error?.stack);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

const logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check forgot password eligibility — 4 attempts per 5 days
    const eligibility = await checkForgotPasswordEligibility(email);
    if (!eligibility.allowed) {
      return res.status(429).json({
        error: eligibility.message,
        code: "FORGOT_PASSWORD_BLOCKED",
        showContactAdmin: eligibility.showContactAdmin || false,
        remainingMs: eligibility.remainingMs || null,
        attemptsUsed: eligibility.attemptsUsed || 0,
        maxAttempts: eligibility.maxAttempts || 4,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });

      // Record forgot password usage and get remaining attempts
      const usage = await recordForgotPasswordUsage(user.id);

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      try {
        const { sendPasswordResetEmail } = require("../utils/email");
        await sendPasswordResetEmail(email, user.firstName, resetLink, usage.remaining);
      } catch (emailErr) {
        console.error("[EMAIL] Password reset email failed:", emailErr.message);
      }
    }

    // Always return the same response — prevents email enumeration
    res.json({
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, twoFactorCode } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password)) return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
    if (!/[a-z]/.test(password)) return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
    if (!/[0-9]/.test(password)) return res.status(400).json({ error: "Password must contain at least one number" });
    if (!/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ error: "Password must contain at least one symbol (e.g. !@#$%)" });

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        tokenVersion: { increment: 1 },
        twoFactorEnabled: false,
        googleAuthSecret: null,
        twoFactorFailedAttempts: 0,
        twoFactorLockedUntil: null,
        twoFactorPermanentlyLocked: false,
        backupCodes: null,
      },
    });

    // Invalidate auth cache so old sessions are rejected immediately
    try { require("../middleware/auth").invalidateAuthCache(user.id); } catch {}

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });
    const user = await prisma.user.findFirst({
      where: { resetToken: token, isEmailVerified: false },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
};

const verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.phoneOtp || !user.phoneOtpExpiry || user.phoneOtpExpiry < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (user.phoneOtp !== otp) {
      const attempts = (user.phoneOtpAttempts || 0) + 1;
      if (attempts >= 5) {
        await prisma.user.update({
          where: { id: userId },
          data: { phoneOtp: null, phoneOtpExpiry: null, phoneOtpAttempts: 0 },
        });
        return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { phoneOtpAttempts: attempts },
      });
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true, phoneOtp: null, phoneOtpExpiry: null, phoneOtpAttempts: 0 },
    });

    res.json({ message: "Phone verified successfully" });
  } catch (error) {
    console.error("Verify phone error:", error);
    res.status(500).json({ error: "Failed to verify phone" });
  }
};

const sendEmailVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isEmailVerified) return res.json({ message: "Email already verified" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    await prisma.user.update({
      where: { id: userId },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    try {
      const { sendEmail } = require("../utils/email");
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email - Ethio Nikah",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#D4AF37">Verify Your Email</h2>
          <p>Assalamu Alaikum ${user.firstName},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#D4AF37;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;margin:20px 0">Verify Email</a>
          <p>Or copy this link: ${verifyUrl}</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>`,
      });
    } catch (emailErr) {
      console.error("[EMAIL] Verification email failed:", emailErr.message);
    }

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Send email verification error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
};

const sendPhoneOtp = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 600000); // 10 minutes

    await prisma.user.update({
      where: { id: userId },
      data: { phoneOtp: otp, phoneOtpExpiry: expiry, phoneOtpAttempts: 0 },
    });

    try {
      const { sendOtpEmail } = require("../utils/email");
      await sendOtpEmail(user.email, user.firstName, otp, "phone");
    } catch (emailErr) {
      console.error("[EMAIL] OTP email failed:", emailErr.message);
    }

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

const setUsername = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    const clean = username.trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
      return res.status(400).json({ error: "Username must be 3-30 characters, letters, numbers, and underscores only" });
    }

    const existing = await prisma.user.findUnique({ where: { username: clean } });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ error: "Username already taken" });
    }

    await prisma.user.update({ where: { id: userId }, data: { username: clean } });
    res.json({ message: "Username set successfully", username: clean });
  } catch (error) {
    console.error("Set username error:", error);
    res.status(500).json({ error: "Failed to set username" });
  }
};

const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Username query param required" });
    const clean = username.trim().toLowerCase().replace(/^@/, "");
    const existing = await prisma.user.findUnique({ where: { username: clean } });
    res.json({ available: !existing, username: clean });
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({ error: "Failed to check username" });
  }
};

const lookupByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        gender: true,
        isVerified: true,
        profile: {
          select: {
            photos: true,
            city: true,
            country: true,
            occupation: true,
          },
        },
      },
    });
    if (!user || user.isDeleted) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) {
    console.error("Lookup by username error:", error);
    res.status(500).json({ error: "Failed to lookup user" });
  }
};

const deleteMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.deletedAt || user.isDeleted) {
      return res.status(400).json({ error: "Account is already deleted" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isDeleted: true,
        dataDeletionRequestedAt: new Date(),
        isActive: false,
        tokenVersion: { increment: 1 },
      },
    });

    // Invalidate auth cache so deleted user's sessions are rejected immediately
    try { require("../middleware/auth").invalidateAuthCache(userId); } catch {}

    await logAudit({ userId, action: "USER_SOFT_DELETE", details: "User requested account deletion" });
    res.json({ message: "Account scheduled for deletion. You can restore it within 30 days by contacting support." });
  } catch (error) {
    console.error("Delete me error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};

// Security violation — block and soft-delete account immediately
// Called when a user attempts cross-role access (privilege escalation)
const securityBlock = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Account not found" });

    const reason = req.body.reason || "Cross-role access violation — privilege escalation attempt";

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        tokenVersion: { increment: 1 },
        isFlaggedForReview: true,
      },
    });

    // Create a restriction record
    await prisma.userRestriction.create({
      data: {
        userId,
        type: "ban",
        reason: `SECURITY: ${reason}`,
        createdBy: userId,
      },
    }).catch(() => {});

    // Invalidate auth cache so all sessions are rejected immediately
    try { require("../middleware/auth").invalidateAuthCache(userId); } catch {}

    await logAudit({ userId, action: "SECURITY_BLOCK", details: reason });
    res.json({ message: "Account blocked due to security violation" });
  } catch (error) {
    console.error("Security block error:", error);
    res.status(500).json({ error: "Failed to block account" });
  }
};

const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { passwordHash: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid password", valid: false });

    res.json({ valid: true });
  } catch (error) {
    console.error("Verify password error:", error);
    res.status(500).json({ error: "Failed to verify password" });
  }
};

module.exports = {
  register,
  login,
  loginWithPhone,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyPhone,
  sendPhoneOtp,
  sendEmailVerification,
  setUsername,
  checkUsername,
  lookupByUsername,
  deleteMe,
  securityBlock,
  verifyPassword,
};
