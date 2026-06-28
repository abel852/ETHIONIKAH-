const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, messageController.sendMessage);
router.get("/conversations", authenticate, messageController.getConversations);
router.get("/conversation/:otherUserId", authenticate, messageController.getConversation);
router.put("/:messageId/read", authenticate, messageController.markAsRead);
router.delete("/:messageId", authenticate, messageController.deleteMessage);
router.post("/block", authenticate, messageController.blockUser);

module.exports = router;
