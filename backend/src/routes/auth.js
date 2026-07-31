const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const twoFactorController = require("../controllers/twoFactorController");
const { authenticate, authorize } = require("../middleware/auth");
const { registerSchema, loginSchema, phoneLoginSchema, validate } = require("../validators/auth");
const { loginLimiter, loginBanCheck, loginRateInfo, signupLimiter, passwordResetLimiter, throttle } = require("../middleware/rateLimiter");

router.post("/register", signupLimiter, validate(registerSchema), authController.register);
router.post("/login", loginBanCheck, loginLimiter, loginRateInfo, validate(loginSchema), authController.login);
router.post("/login/phone", loginBanCheck, loginLimiter, loginRateInfo, validate(phoneLoginSchema), authController.loginWithPhone);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refreshToken);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);
router.post("/verify-email", throttle(5, 15 * 60 * 1000), authController.verifyEmail);
router.post("/send-email-verification", authenticate, throttle(3, 60 * 1000), authController.sendEmailVerification);
router.post("/verify-phone", authenticate, authController.verifyPhone);
router.post("/send-phone-otp", authenticate, throttle(3, 60 * 1000), authController.sendPhoneOtp);
router.get("/me", authenticate, authController.getMe);
router.delete("/me", authenticate, authController.deleteMe);
router.post("/security-block", authenticate, authController.securityBlock);
router.post("/username", authenticate, authController.setUsername);
router.get("/username/check", throttle(10, 60 * 1000), authController.checkUsername);
router.get("/username/:username", throttle(10, 60 * 1000), authController.lookupByUsername);

router.post("/2fa/verify", twoFactorController.verify2FALogin);
router.get("/2fa/status", authenticate, twoFactorController.get2FAStatus);
router.post("/2fa/enable", authenticate, twoFactorController.enable2FA);
router.post("/2fa/confirm", authenticate, twoFactorController.confirm2FA);
router.post("/2fa/disable", authenticate, twoFactorController.disable2FA);
router.get("/2fa/recovery-codes", authenticate, twoFactorController.getRecoveryCodes);
router.post("/2fa/regenerate-codes", authenticate, twoFactorController.regenerateBackupCodes);
router.post("/2fa/trust-device", authenticate, twoFactorController.trustedDevice);
router.get("/2fa/lockout-status", authenticate, twoFactorController.checkLockout);
router.post("/2fa/admin-reset/:id", authenticate, authorize("admin"), twoFactorController.adminReset2FA);
router.post("/verify-password", authenticate, throttle(5, 60000), authController.verifyPassword);

module.exports = router;
