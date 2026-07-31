const express = require("express");
const router = express.Router();
const controller = require("../controllers/conversationRequestController");
const { authenticate, requireActive } = require("../middleware/auth");
const { throttle } = require("../middleware/rateLimiter");

router.post("/", authenticate, requireActive, throttle(5, 60000), controller.createConversationRequest);
router.post("/:requestId/respond", authenticate, requireActive, controller.respondToConversationRequest);
router.get("/received", authenticate, requireActive, controller.getReceivedRequests);
router.get("/sent", authenticate, requireActive, controller.getSentRequests);
router.get("/status/:targetUserId", authenticate, requireActive, controller.checkRequestStatus);

module.exports = router;
