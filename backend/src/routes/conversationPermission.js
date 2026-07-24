const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/conversationPermissionController");
const { authenticate, requireActive } = require("../middleware/auth");
const { throttle } = require("../middleware/rateLimiter");

router.post("/request", authenticate, requireActive, throttle(5, 60000), permissionController.requestPermission);
router.post("/:permissionId/respond", authenticate, requireActive, permissionController.respondToPermission);
router.get("/received", authenticate, requireActive, permissionController.getReceivedPermissions);
router.get("/sent", authenticate, requireActive, permissionController.getSentPermissions);

module.exports = router;
