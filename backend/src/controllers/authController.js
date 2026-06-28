const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const { generateAccessToken, generateRefreshToken } = require("../config/auth");
const { logAudit } = require("../utils/auditLogger");

const register = async (req, res) => {
  try {
    const {
      email, phone, password, firstName, lastName, gender, dateOfBirth,
      nationality, country, city, height, maritalStatus, childrenStatus,
      religiousCommitment, prayerHabits, quranReadingFrequency,
      islamicClassesAttendance, preferredReligiousCommitment,
      educationLevel, occupation, employmentStatus, monthlyIncomeRange,
      reasonForJoining, desiredMarriageTimeline, childrenPreference,
      ethnicBackground, motherTongue, familyInvolvement,
      smokingHabits, khatUsage, exerciseHabits, livingPreference,
      selfDescription, qualities, interests,
      preferredAgeMin, preferredAgeMax, preferredMaritalStatus,
      preferredEducationLevel, preferredLocation, waliInvolvement,
      polygamyPreference, mahrExpectation, genderInteraction,
    } = req.validatedBody;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
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
      },
    });

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        nationality,
        country,
        city,
        height: height || null,
        maritalStatus: maritalStatus || "single",
        childrenStatus,
        religiousCommitment,
        prayerHabits,
        quranReadingFrequency,
        islamicClassesAttendance,
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
        selfDescription,
        qualities: toArray(qualities),
        interests: toArray(interests),
        isProfileComplete: true,
      },
    });

    if (preferredAgeMin || preferredAgeMax || preferredMaritalStatus ||
        preferredEducationLevel || preferredLocation || waliInvolvement ||
        polygamyPreference || mahrExpectation || genderInteraction ||
        preferredReligiousCommitment) {
      await prisma.spousePreference.create({
        data: {
          profileId: profile.id,
          preferredAgeMin: preferredAgeMin || 18,
          preferredAgeMax: preferredAgeMax || 99,
          preferredMaritalStatus: preferredMaritalStatus || "any",
          preferredEducationLevel: preferredEducationLevel || "any",
          preferredLocation: preferredLocation || "",
          waliInvolvement: waliInvolvement || "optional",
          polygamyPreference: polygamyPreference || "not_acceptable",
          mahrExpectation: mahrExpectation || "",
          genderInteraction: genderInteraction || "moderate",
          preferredReligiousCommitment: preferredReligiousCommitment || "any",
        },
      });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion ?? 0 });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(201).json({
      message: "Registration successful",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, verification: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is suspended" });
    }

    const now = new Date();
    if (user.twoFactorPermanentlyLocked) {
      return res.status(403).json({ error: "Account locked. Contact admin via Help & Support." });
    }
    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > now) {
      return res.status(403).json({ error: "Account temporarily locked. Try again later." });
    }

    if (user.twoFactorEnabled) {
      const trustedDeviceToken = req.headers["x-trusted-device"];
      if (trustedDeviceToken) {
        try {
          const decoded = jwt.verify(trustedDeviceToken, process.env.JWT_SECRET);
          if (decoded.purpose === "trusted_device" && decoded.userId === user.id) {
            return finishLogin();
          }
        } catch {}
      }

      const tempToken = jwt.sign(
        { userId: user.id, purpose: "2fa" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      return res.json({
        requiresTwoFactor: true,
        tempToken,
        userId: user.id,
        email: user.email,
        captchaRequired: user.twoFactorFailedAttempts >= 2,
      });
    }

    return finishLogin();

    async function finishLogin() {
      user.lastLoginAt = now;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now, twoFactorFailedAttempts: 0 },
      });

      const accessToken = generateAccessToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
      const refreshToken = generateRefreshToken({ userId: user.id });

      const { passwordHash, ...userWithoutPassword } = user;

      if (user.role === "admin") {
        logAudit({ adminId: user.id, action: "admin_login", resource: "auth", details: { email: user.email } });
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
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { profile: true, verification: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is suspended" });
    }

    const now = new Date();
    if (user.twoFactorPermanentlyLocked) {
      return res.status(403).json({ error: "Account locked. Contact admin via Help & Support." });
    }
    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > now) {
      return res.status(403).json({ error: "Account temporarily locked. Try again later." });
    }

    if (user.twoFactorEnabled) {
      const trustedDeviceToken = req.headers["x-trusted-device"];
      if (trustedDeviceToken) {
        try {
          const decoded = jwt.verify(trustedDeviceToken, process.env.JWT_SECRET);
          if (decoded.purpose === "trusted_device" && decoded.userId === user.id) {
            return finishLogin();
          }
        } catch {}
      }

      const tempToken = jwt.sign(
        { userId: user.id, purpose: "2fa" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      return res.json({
        requiresTwoFactor: true,
        tempToken,
        userId: user.id,
        email: user.email,
        captchaRequired: user.twoFactorFailedAttempts >= 2,
      });
    }

    return finishLogin();

    async function finishLogin() {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now, twoFactorFailedAttempts: 0 },
      });

      const accessToken = generateAccessToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
      const refreshToken = generateRefreshToken({ userId: user.id });

      const { passwordHash, ...userWithoutPassword } = user;

      if (user.role === "admin") {
        logAudit({ adminId: user.id, action: "admin_login", resource: "auth", details: { phone: user.phone } });
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
      select: { id: true, role: true, isActive: true, tokenVersion: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
    const newRefreshToken = generateRefreshToken({ userId: user.id });

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
        gender: true,
        dateOfBirth: true,
        role: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        profile: true,
        verification: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.profile) {
      user.photos = user.profile.photos;
    }
    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

const logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "No account with that email" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    console.log(`[DEV] Password reset token for ${email}: ${token}`);
    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, twoFactorCode } = req.body;
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) return res.status(400).json({ error: "2FA code required" });
      const speakeasy = require("speakeasy");
      const verified = speakeasy.totp.verify({ secret: user.googleAuthSecret, encoding: "base32", token: twoFactorCode, window: 1 });
      if (!verified) return res.status(400).json({ error: "Invalid 2FA code" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findFirst({
      where: { resetToken: token },
    });
    if (!user) return res.status(400).json({ error: "Invalid token" });

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, resetToken: null },
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
};

const verifyPhone = async (req, res) => {
  try {
    const { otp, userId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.phoneOtp !== otp || !user.phoneOtpExpiry || user.phoneOtpExpiry < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true, phoneOtp: null, phoneOtpExpiry: null },
    });

    res.json({ message: "Phone verified successfully" });
  } catch (error) {
    console.error("Verify phone error:", error);
    res.status(500).json({ error: "Failed to verify phone" });
  }
};

const sendPhoneOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 600000); // 10 minutes

    await prisma.user.update({
      where: { id: userId },
      data: { phoneOtp: otp, phoneOtpExpiry: expiry },
    });

    console.log(`[DEV] OTP for user ${userId}: ${otp}`);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
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
};
