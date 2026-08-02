const express = require("express");
const router = express.Router();
const controller = require("../controllers/exclusivePartnershipController");
const { authenticate, requireActive } = require("../middleware/auth");
const { throttle } = require("../middleware/rateLimiter");

router.post("/request", authenticate, requireActive, throttle(3, 60000), controller.requestExclusivePartnership);
router.post("/request/:requestId/respond", authenticate, requireActive, controller.respondToPartnershipRequest);
router.post("/request/:requestId/cancel", authenticate, requireActive, controller.cancelPartnershipRequest);
router.post("/:partnershipId/end", authenticate, requireActive, controller.endPartnership);
router.get("/mine", authenticate, requireActive, controller.getMyPartnership);
router.get("/requests/received", authenticate, requireActive, controller.getReceivedPartnershipRequests);
router.get("/requests/sent", authenticate, requireActive, controller.getSentPartnershipRequests);
router.get("/status/:targetUserId", authenticate, requireActive, controller.checkPartnershipStatus);

module.exports = router;
