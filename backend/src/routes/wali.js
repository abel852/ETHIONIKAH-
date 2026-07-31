const express = require("express");
const router = express.Router();
const waliController = require("../controllers/waliController");
const { authenticate, requireActive } = require("../middleware/auth");
const { throttle } = require("../middleware/rateLimiter");

// Authenticated routes — for partners to invite/approve/decline/revoke/check
router.post("/invite", authenticate, requireActive, throttle(3, 60000), waliController.inviteWali);
router.post("/approve", authenticate, requireActive, waliController.approveWali);
router.post("/decline", authenticate, requireActive, waliController.declineWali);
router.post("/revoke", authenticate, requireActive, waliController.revokeWali);
router.get("/status/:partnershipId", authenticate, requireActive, waliController.getWaliStatus);

// Public routes — token-based, no authentication required
router.get("/view/:token", waliController.verifyWaliToken);
router.get("/view/:token/messages", waliController.getWaliMessages);

module.exports = router;
