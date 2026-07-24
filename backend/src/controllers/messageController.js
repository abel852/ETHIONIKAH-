const prisma = require("../config/database");
const { emitNewMessage, emitMessageDeleted, emitMessageRead } = require("../utils/messageSocket");
const { ensureContactCredits } = require("./membershipPlanController");

const blockedWords = [
  "fuck", "shit", "ass", "bitch", "damn", "bastard", "crap", "dick",
  "piss", "slut", "whore", "cock", "cunt", "douche", "fag", "nigger",
  "nigga", "kike", "spic", "chink", "gook", "rape", "molest",
  "porn", "sex", "xxx", "escort", "hooker", "strip",
];

function containsProfanity(text) {
  const lower = text.toLowerCase();
  return blockedWords.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

/**
 * Enforce one active conversation at a time.
 * Returns { allowed: true } or { allowed: false, error: string, status: number }
 */
async function checkOneConversationRule(senderId, receiverId) {
  try {
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { userId: senderId, matchedUserId: receiverId },
          { userId: receiverId, matchedUserId: senderId },
        ],
        status: "accepted",
      },
    });
    if (match) return { allowed: true };

    const priorMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
    if (priorMessages > 0) return { allowed: true };

    // NEW conversation — check if sender has other active conversations
    const sentMessages = await prisma.message.findMany({
      where: {
        senderId: senderId,
        receiverId: { not: receiverId },
        deletedForSender: false,
      },
      select: { receiverId: true },
      distinct: ["receiverId"],
    });

    const receivedMessages = await prisma.message.findMany({
      where: {
        receiverId: senderId,
        senderId: { not: receiverId },
        deletedForReceiver: false,
      },
      select: { senderId: true },
      distinct: ["senderId"],
    });

    const allPartners = new Set([
      ...sentMessages.map((m) => m.receiverId),
      ...receivedMessages.map((m) => m.senderId),
    ]);

    // Remove blocked partners
    const blockedUsers = await prisma.blockedUser.findMany({
      where: {
        OR: [
          { blockerId: senderId },
          { blockedId: senderId },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });

    for (const b of blockedUsers) {
      const otherId = b.blockerId === senderId ? b.blockedId : b.blockerId;
      allPartners.delete(otherId);
    }

    const existingPartners = Array.from(allPartners);

    if (existingPartners.length > 0) {
      // Check if sender has approved permissions (polygamy)
      const approvedPermissions = await prisma.conversationPermission.findMany({
        where: {
          requesterId: senderId,
          targetUserId: receiverId,
          status: "approved",
          partnerId: { in: existingPartners },
        },
        select: { partnerId: true },
      });

      const approvedPartnerIds = approvedPermissions.map((p) => p.partnerId);
      const missingPartners = existingPartners.filter((pid) => !approvedPartnerIds.includes(pid));

      if (missingPartners.length > 0) {
        return {
          allowed: false,
          status: 403,
          error: "You already have an active conversation. To start a new one, you need to block or delete your current conversation first.",
        };
      }
    }

    // No active conversations — check subscription for match bypass
    const senderSubscription = await prisma.subscription.findFirst({
      where: {
        userId: senderId,
        status: "active",
        planType: { in: ["gold", "platinum"] },
        endDate: { gte: new Date() },
      },
      select: { planType: true },
    });

    if (senderSubscription) {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { isVerified: true },
      });
      if (!receiver?.isVerified) {
        return { allowed: false, status: 403, error: "You can only message verified users." };
      }
      return { allowed: true };
    }

    return { allowed: false, status: 403, error: "You can only message users you have matched with. Upgrade to Gold or Platinum to message any verified user." };
  } catch {
    return { allowed: true };
  }
}

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, content, replyToId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({ error: "Cannot send message to yourself" });
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { isVerified: true, isActive: true },
    });
    if (!sender.isVerified) {
      return res.status(403).json({ error: "Your account must be verified before you can send messages. Please complete the verification process." });
    }
    if (!sender.isActive) {
      return res.status(403).json({ error: "Your account has been suspended. You cannot send messages." });
    }

    const chatRestriction = await prisma.userRestriction.findFirst({
      where: {
        userId: senderId,
        type: "chat_restrict",
        OR: [
          { expiresAt: { gt: new Date() } },
          { expiresAt: null },
        ],
      },
    });
    if (chatRestriction) {
      const msg = chatRestriction.expiresAt
        ? `Your chat ability has been restricted until ${chatRestriction.expiresAt.toISOString()}. Reason: ${chatRestriction.reason || "No reason provided"}`
        : `Your chat ability has been restricted. Reason: ${chatRestriction.reason || "No reason provided"}`;
      return res.status(403).json({ error: msg });
    }

    // One active conversation rule + match gate
    const convCheck = await checkOneConversationRule(senderId, receiverId);
    if (!convCheck.allowed) {
      return res.status(convCheck.status).json({ error: convCheck.error });
    }

    // Block check: receiver must not have blocked sender
    try {
      const blocked = await prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: receiverId, blockedId: senderId } },
      });
      if (blocked) {
        return res.status(403).json({ error: "You cannot message this user." });
      }
    } catch (_e) {}

    // Profanity filter
    if (containsProfanity(content || "")) {
      return res.status(400).json({ error: "Message contains inappropriate language and cannot be sent." });
    }

    if (replyToId) {
      const replyToMsg = await prisma.message.findUnique({ where: { id: replyToId } });
      if (!replyToMsg) return res.status(400).json({ error: "Message to reply to not found" });
    }

    // Contact credit check: free users need credits to initiate first conversation
    const hasActiveSub = await prisma.subscription.findFirst({
      where: { userId: senderId, status: "active", endDate: { gt: new Date() } },
    });
    if (!hasActiveSub) {
      const priorFromSender = await prisma.message.count({
        where: { senderId, receiverId },
      });
      if (priorFromSender === 0) {
        const creditRecord = await ensureContactCredits(senderId);
        if (creditRecord.credits <= 0) {
          return res.status(403).json({ error: "You need contact credits to start a conversation. Purchase credits or upgrade to a Gold/Platinum membership." });
        }
        await prisma.userContactCredit.update({
          where: { userId: senderId },
          data: {
            credits: { decrement: 1 },
            usedCredits: { increment: 1 },
          },
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        replyToId: replyToId || null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
        replyTo: { select: { id: true, content: true, senderId: true, sender: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    emitNewMessage(message, receiverId);

    res.status(201).json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const getConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;
    const before = req.query.before; // cursor-based pagination (ISO date)
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100); // max 100 per request

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        NOT: {
          OR: [
            { senderId: userId, deletedForSender: true },
            { senderId: otherUserId, deletedForReceiver: true },
          ],
        },
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, username: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, username: true } },
        replyTo: { select: { id: true, content: true, senderId: true, sender: { select: { id: true, firstName: true, lastName: true, username: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    const matchRecord = await prisma.match.findFirst({
      where: {
        OR: [
          { userId, matchedUserId: otherUserId },
          { userId: otherUserId, matchedUserId: userId },
        ],
        status: "accepted",
      },
      select: { compatibilityScore: true },
    });

    res.json({
      messages,
      matchReason: matchRecord?.compatibilityScore
        ? `Compatibility: ${Math.round(matchRecord.compatibilityScore)}%`
        : null,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch recent messages — limit to prevent loading entire history
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        NOT: {
          OR: [
            { senderId: userId, deletedForSender: true },
            { receiverId: userId, deletedForReceiver: true },
          ],
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
            isVerified: true,
            lastLoginAt: true,
            profile: { select: { photos: true } },
            subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, select: { planType: true }, take: 1 },
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
            isVerified: true,
            lastLoginAt: true,
            profile: { select: { photos: true } },
            subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, select: { planType: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500, // Limit to recent 500 messages for conversation list
    });

    const conversations = {};
    const otherUserIds = new Set();

    // First pass: collect unique other-user IDs and build conversation list
    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!otherUser || otherUser.role === "admin") continue;

      otherUserIds.add(otherUserId);

      if (!conversations[otherUserId]) {
        const membershipPlan = otherUser.subscriptions?.length > 0 ? otherUser.subscriptions[0].planType : null;
        delete otherUser.subscriptions;
        conversations[otherUserId] = {
          user: { ...otherUser, lastLoginAt: otherUser.lastLoginAt || undefined, membershipPlan },
          lastMessage: msg,
          unreadCount: 0,
          isOnline: false,
        };
      }

      if (msg.receiverId === userId && !msg.isRead) {
        conversations[otherUserId].unreadCount++;
      }
    }

    // Batch-fetch all match records in a single query (fixes N+1)
    if (otherUserIds.size > 0) {
      const matchRecords = await prisma.match.findMany({
        where: {
          status: "accepted",
          OR: [
            { userId, matchedUserId: { in: [...otherUserIds] } },
            { userId: { in: [...otherUserIds] }, matchedUserId: userId },
          ],
        },
        select: { userId: true, matchedUserId: true, compatibilityScore: true },
      });

      // Map match scores to conversations
      for (const match of matchRecords) {
        const otherId = match.userId === userId ? match.matchedUserId : match.userId;
        if (conversations[otherId]) {
          conversations[otherId].compatibilityReason = match.compatibilityScore
            ? `Compatibility: ${Math.round(match.compatibilityScore)}%`
            : undefined;
        }
      }
    }

    res.json({ conversations: Object.values(conversations) });
  } catch (error) {
    console.error("=== GET CONVERSATIONS ERROR ===", error?.message, error?.stack);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    await prisma.message.updateMany({
      where: { id: messageId, receiverId: userId },
      data: { isRead: true, readAt: new Date() },
    });

    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, receiverId: true },
    });
    if (msg) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      emitMessageRead(messageId, otherId, msg.senderId);
    }

    res.json({ message: "Message marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { deleteFor } = req.body;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isSender = message.senderId === userId;
    if (!isSender && message.receiverId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    if (deleteFor === "both" && isSender) {
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedForSender: true, deletedForReceiver: true },
      });
      emitMessageDeleted(messageId, "both", [message.senderId, message.receiverId]);
    } else if (isSender) {
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedForSender: true },
      });
      emitMessageDeleted(messageId, "me", [message.senderId]);
    } else {
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedForReceiver: true },
      });
      emitMessageDeleted(messageId, "me", [message.receiverId]);
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

const sendMessageToAdmin = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Message content is required" });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { isVerified: true, isActive: true },
    });
    if (!sender.isVerified) {
      return res.status(403).json({ error: "Your account must be verified before you can send messages." });
    }
    if (!sender.isActive) {
      return res.status(403).json({ error: "Your account has been suspended." });
    }

    const admin = await prisma.user.findFirst({
      where: { role: "admin", isActive: true },
      orderBy: { lastLoginAt: "desc" },
      select: { id: true },
    });
    if (!admin) return res.status(500).json({ error: "No admin available" });

    if (containsProfanity(content || "")) {
      return res.status(400).json({ error: "Message contains inappropriate language." });
    }

    const message = await prisma.message.create({
      data: { senderId, receiverId: admin.id, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.status(201).json({ message });
  } catch (error) {
    console.error("Send to admin error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({ error: "blockedUserId is required" });
    }

    try {
      const existing = await prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: userId, blockedId: blockedUserId } },
      });
      if (existing) {
        return res.json({ message: "User already blocked" });
      }

      await prisma.blockedUser.create({
        data: { blockerId: userId, blockedId: blockedUserId },
      });
    } catch (_e) {}

    res.json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;
    const { deleteFor } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId is required" });
    }

    if (deleteFor === "both") {
      const messageCount = await prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      });

      if (messageCount === 0) {
        return res.status(404).json({ error: "No messages found" });
      }

      await prisma.message.updateMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        data: { deletedForSender: true, deletedForReceiver: true },
      });

      emitMessageDeleted("all", "both", [userId, otherUserId]);
    } else {
      await prisma.message.updateMany({
        where: {
          senderId: userId,
          receiverId: otherUserId,
          deletedForSender: false,
        },
        data: { deletedForSender: true },
      });

      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          deletedForReceiver: false,
        },
        data: { deletedForReceiver: true },
      });

      emitMessageDeleted("all", "me", [userId]);
    }

    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};

const sendImage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, caption } = req.body;

    if (!receiverId) return res.status(400).json({ error: "receiverId is required" });
    if (!req.file) return res.status(400).json({ error: "Image is required" });

    // Block check
    try {
      const blocked = await prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: receiverId, blockedId: senderId } },
      });
      if (blocked) return res.status(403).json({ error: "Cannot message this user." });
    } catch (_e) {}

    // One active conversation rule
    const convCheck = await checkOneConversationRule(senderId, receiverId);
    if (!convCheck.allowed) {
      return res.status(convCheck.status).json({ error: convCheck.error });
    }

    const imageUrl = "uploads/chat-images/" + req.file.filename;
    const content = caption ? `IMG:${imageUrl}|${caption}` : `IMG:${imageUrl}`;
    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    emitNewMessage(message, receiverId);
    res.status(201).json({ message });
  } catch (error) {
    console.error("Send image error:", error);
    res.status(500).json({ error: "Failed to send image" });
  }
};

const sendFile = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, caption } = req.body;

    if (!receiverId) return res.status(400).json({ error: "receiverId is required" });
    if (!req.file) return res.status(400).json({ error: "File is required" });

    // Block check
    try {
      const blocked = await prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: receiverId, blockedId: senderId } },
      });
      if (blocked) return res.status(403).json({ error: "Cannot message this user." });
    } catch (_e) {}

    // One active conversation rule
    const convCheck = await checkOneConversationRule(senderId, receiverId);
    if (!convCheck.allowed) {
      return res.status(convCheck.status).json({ error: convCheck.error });
    }

    const fileUrl = "uploads/chat-files/" + req.file.filename;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const content = caption
      ? `FILE:${fileUrl}|${fileName}|${fileSize}|${caption}`
      : `FILE:${fileUrl}|${fileName}|${fileSize}`;
    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    emitNewMessage(message, receiverId);
    res.status(201).json({ message });
  } catch (error) {
    console.error("Send file error:", error);
    res.status(500).json({ error: "Failed to send file" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({ error: "blockedUserId is required" });
    }

    await prisma.blockedUser.deleteMany({
      where: { blockerId: userId, blockedId: blockedUserId },
    });

    res.json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
};

module.exports = {
  sendMessage,
  sendImage,
  sendFile,
  sendMessageToAdmin,
  getConversation,
  getConversations,
  markAsRead,
  deleteMessage,
  blockUser,
  unblockUser,
  deleteConversation,
};