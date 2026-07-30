const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");
const { cacheResponse } = require("../middleware/cache");

router.use(authenticate);

router.get("/", cacheResponse(15), notificationController.getNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);
router.get("/unread-count", cacheResponse(15), notificationController.getUnreadCount);

module.exports = router;
