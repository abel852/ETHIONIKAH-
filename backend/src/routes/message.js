const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authenticate, requireActive } = require("../middleware/auth");
const upload = require("../config/storage");
const { messageLimiter, messageUploadLimiter, throttle } = require("../middleware/rateLimiter");
const { messageConcurrencyLimiter, uploadConcurrencyLimiter } = require("../middleware/concurrencyLimiter");
const { validate } = require("../validators/auth");
const { sendMessageSchema, sendImageSchema, sendFileSchema, blockUserSchema, deleteMessageSchema, deleteConversationSchema } = require("../validators/message");
const { verifyUpload } = require("../middleware/uploadSecurity");

router.post("/", authenticate, requireActive, messageConcurrencyLimiter, messageLimiter, validate(sendMessageSchema), messageController.sendMessage);
router.post("/image", authenticate, requireActive, uploadConcurrencyLimiter, messageUploadLimiter, upload.single("chatImage"), validate(sendImageSchema), verifyUpload("chatImage"), messageController.sendImage);
router.post("/file", authenticate, requireActive, uploadConcurrencyLimiter, messageUploadLimiter, upload.single("chatFile"), validate(sendFileSchema), verifyUpload("chatFile"), messageController.sendFile);
router.post("/admin", authenticate, requireActive, messageConcurrencyLimiter, messageLimiter, validate(sendMessageSchema), messageController.sendMessageToAdmin);
router.get("/conversations", authenticate, requireActive, messageController.getConversations);
router.get("/conversation/:otherUserId", authenticate, requireActive, messageController.getConversation);
router.put("/:messageId/read", authenticate, requireActive, messageController.markAsRead);
router.delete("/:messageId", authenticate, requireActive, messageController.deleteMessage);
router.post("/block", authenticate, requireActive, validate(blockUserSchema), messageController.blockUser);
router.post("/unblock", authenticate, requireActive, validate(blockUserSchema), messageController.unblockUser);
router.post("/conversation/:otherUserId/delete", authenticate, requireActive, validate(deleteConversationSchema), messageController.deleteConversation);
router.get("/active-partners/:userId", authenticate, requireActive, messageController.getActiveChatPartners);

module.exports = router;
