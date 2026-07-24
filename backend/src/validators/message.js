const { z } = require("zod");

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "receiverId is required"),
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long (max 5000 chars)"),
  replyToId: z.string().optional(),
});

const sendImageSchema = z.object({
  receiverId: z.string().min(1, "receiverId is required"),
  caption: z.string().max(500, "Caption too long").optional(),
});

const sendFileSchema = z.object({
  receiverId: z.string().min(1, "receiverId is required"),
  caption: z.string().max(500, "Caption too long").optional(),
});

const blockUserSchema = z.object({
  blockedUserId: z.string().min(1, "blockedUserId is required"),
});

const deleteMessageSchema = z.object({
  deleteFor: z.enum(["me", "both"]).default("me"),
});

const deleteConversationSchema = z.object({
  deleteFor: z.enum(["me", "both"]).default("me"),
});

module.exports = {
  sendMessageSchema,
  sendImageSchema,
  sendFileSchema,
  blockUserSchema,
  deleteMessageSchema,
  deleteConversationSchema,
};
