const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const twoFactorController = require("../controllers/twoFactorController");
const { authenticate } = require("../middleware/auth");
const { registerSchema, loginSchema, validate } = require("../validators/auth");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/login/phone", authController.loginWithPhone);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);
router.post("/verify-phone", authenticate, authController.verifyPhone);
router.post("/send-phone-otp", authenticate, authController.sendPhoneOtp);
router.get("/me", authenticate, authController.getMe);

router.post("/2fa/verify", twoFactorController.verify2FALogin);
router.get("/2fa/status", authenticate, twoFactorController.get2FAStatus);
router.post("/2fa/enable", authenticate, twoFactorController.enable2FA);
router.post("/2fa/confirm", authenticate, twoFactorController.confirm2FA);
router.post("/2fa/disable", authenticate, twoFactorController.disable2FA);
router.get("/2fa/recovery-codes", authenticate, twoFactorController.getRecoveryCodes);
router.post("/2fa/regenerate-codes", authenticate, twoFactorController.regenerateBackupCodes);
router.post("/2fa/trust-device", authenticate, twoFactorController.trustedDevice);
router.get("/2fa/lockout-status", authenticate, twoFactorController.checkLockout);
router.post("/2fa/admin-reset/:id", authenticate, twoFactorController.adminReset2FA);

module.exports = router;
