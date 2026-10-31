const prisma = require("../config/database");
const { emitNewMessage, emitMessageDeleted, emitMessageRead, emitMessageEdited, emitMessageReaction } = require("../utils/messageSocket");
const { ensureContactCredits } = require("./membershipPlanController");
const { uploadMulterFile, isR2Enabled } = require("../config/r2");
const { hasFeature } = require("../utils/subscriptionHelper");

// Send push notification for new message (fire-and-forget)
function sendPushForMessage(message, receiverId) {
  try {
    const { sendPushToUser } = require("../utils/pushService");
    const senderName = `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`.trim() || "Someone";
    const isImage = message.content?.startsWith("IMG:");
    const isFile = message.content?.startsWith("FILE:");
    const preview = isImage ? "📷 Photo" : isFile ? "📎 File" : (message.content || "");
    sendPushToUser(receiverId, {
      title: `Message from ${senderName}`,
      body: preview.length > 80 ? preview.substring(0, 80) + "..." : preview,
      type: "message",
      icon: "/icon.png",
      badge: "/icon.png",
      tag: "message",
      data: { url: "/messages" },
    });
  } catch (e) {
    // Push may not be configured — silently ignore
  }
}

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
 * Detect phone numbers and social media handles in messages.
 * Blocks users from sharing contact info outside the platform.
 */
function containsContactInfo(text) {
  const lower = text.toLowerCase();

  // Phone numbers: international and local formats (3+ consecutive digits with optional separators)
  if (/\+?\d[\d\s\-().]{7,}\d/.test(text)) return true;
  // Ethiopian phone format: 09xxxxxxxx or +251xxxxxxxxx
  if (/09\d{8}/.test(text)) return true;
  if (/\+251\d{9}/.test(text)) return true;

  // Telegram: @username, t.me/username, telegram.me/username
  if (/@[a-z0-9_]{5,}/.test(lower)) return true;
  if (/t\.me\//.test(lower)) return true;
  if (/telegram\.me\//.test(lower)) return true;
  if (/telegram/i.test(lower) && /\b(dm|message|contact|add|reach)\b/i.test(lower)) return true;

  // WhatsApp: wa.me/, whatsapp.com/, whatsapp number
  if (/wa\.me\//.test(lower)) return true;
  if (/whatsapp/i.test(lower)) return true;

  // Instagram: instagram.com/, ig: @username
  if (/instagram\.com\//.test(lower)) return true;
  if (/\big\b[:\s]/.test(lower)) return true;

  // Facebook: facebook.com/, fb.com/, messenger
  if (/facebook\.com\//.test(lower)) return true;
  if (/fb\.com\//.test(lower)) return true;
  if (/messenger/i.test(lower)) return true;

  // Snapchat: snapchat.com/, snap: @username
  if (/snapchat/i.test(lower)) return true;
  if (/\bsnap\b[:\s]/.test(lower)) return true;

  // TikTok: tiktok.com/, tiktok @
  if (/tiktok\.com\//.test(lower)) return true;
  if (/tiktok\s*@/i.test(lower)) return true;

  // Twitter/X: twitter.com/, x.com/
  if (/twitter\.com\//.test(lower)) return true;
  if (/x\.com\//.test(lower)) return true;

  // Generic URL patterns that might link to social profiles
  if (/https?:\/\/(?!localhost|127\.0\.0\.1)/.test(lower)) return true;

  // Email addresses
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(lower)) return true;

  // Keywords suggesting sharing contact info
  const contactKeywords = [
    "my number is", "call me", "text me", "reach me", "contact me",
    "my phone", "my telegram", "my whatsapp", "my insta", "my snap",
    "my facebook", "my tiktok", "my twitter", "dm me", "pm me",
    "outside this app", "outside the app", "other platform",
  ];
  if (contactKeywords.some((kw) => lower.includes(kw))) return true;

  return false;
}

/**
 * Shared pre-send validation: verification, active status, chat restriction, block check.
 * Returns { ok: true } or { ok: false, status: number, error: string }.
 */
async function validateSender(senderId, receiverId) {
  if (senderId === receiverId) {
    return { ok: false, status: 400, error: "Cannot send message to yourself" };
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { isVerified: true, isActive: true },
  });
  if (!sender) {
    return { ok: false, status: 404, error: "User not found" };
  }
  if (!sender.isVerified) {
    return { ok: false, status: 403, error: "Your account must be verified before you can send messages. Please complete the verification process." };
  }
  if (!sender.isActive) {
    return { ok: false, status: 403, error: "Your account has been suspended. You cannot send messages." };
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
    return { ok: false, status: 403, error: msg };
  }

  // Block check: receiver must not have blocked sender
  try {
    const blocked = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: receiverId, blockedId: senderId } },
    });
    if (blocked) {
      return { ok: false, status: 403, error: "You cannot message this user." };
    }
  } catch (_e) {}

  // Exclusive Partnership check: if sender is in an active partnership,
  // they can only message their partner — no one else.
  const activePartnership = await prisma.exclusivePartnership.findFirst({
    where: {
      OR: [
        { userAId: senderId, status: "active" },
        { userBId: senderId, status: "active" },
      ],
    },
    select: { userAId: true, userBId: true },
  });
  if (activePartnership) {
    const partnerId = activePartnership.userAId === senderId
      ? activePartnership.userBId
      : activePartnership.userAId;
    if (receiverId !== partnerId) {
      return { ok: false, status: 403, error: "You are in an active exclusive partnership. You can only message your partner." };
    }
  }

  return { ok: true };
}

/**
 * Check if this is a new conversation (no prior messages between the two users).
 * Credits are only deducted for brand-new conversations.
 * Returns { isNew: true } or { isNew: false }.
 */
async function isNewConversation(senderId, receiverId) {
  const priorFromSender = await prisma.message.count({
    where: { senderId, receiverId },
  });
  const priorFromReceiver = await prisma.message.count({
    where: { senderId: receiverId, receiverId: senderId },
  });
  return priorFromSender === 0 && priorFromReceiver === 0;
}

/**
 * Deduct a contact credit for a new conversation.
 * Returns { ok: true, creditsRemaining } or { ok: false, status, error }.
 */
async function checkAndDeductCredit(senderId, isNew) {
  if (!isNew) return { ok: true, creditsUsed: 0, creditsRemaining: null };

  const hasActiveSub = await prisma.subscription.findFirst({
    where: { userId: senderId, status: "active", endDate: { gt: new Date() } },
  });
  if (hasActiveSub) return { ok: true, creditsUsed: 0, creditsRemaining: null };

  const creditRecord = await ensureContactCredits(senderId);
  if (creditRecord.credits <= 0) {
    const pendingPayment = await prisma.payment.findFirst({
      where: { userId: senderId, status: "pending", planType: { contains: "credit" } },
      orderBy: { createdAt: "desc" },
    });
    if (pendingPayment) {
      return {
        ok: false, status: 403,
        error: "Your credit purchase is pending admin approval. You'll be able to start new conversations once it's approved. To reply to existing conversations, no credits are needed.",
      };
    }
    return {
      ok: false, status: 403,
      error: "You need contact credits to start a new conversation. Buy credits (1 credit = 1 new conversation) or upgrade to Gold/Platinum for unlimited messaging.",
    };
  }

  await prisma.userContactCredit.update({
    where: { userId: senderId },
    data: { credits: { decrement: 1 }, usedCredits: { increment: 1 } },
  });

  return { ok: true, creditsUsed: 1, creditsRemaining: creditRecord.credits - 1 };
}

/**
 * Enforce conversation rules based on ExclusivePartnership.
 * - If sender has an ACTIVE ExclusivePartnership, they can only message their partner.
 * - No exceptions, no permission bypass.
 * Returns { allowed: true } or { allowed: false, error, status }.
 */
async function checkOneConversationRule(senderId, receiverId) {
  try {
    // Check if sender has an ACTIVE ExclusivePartnership
    const activePartnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: senderId, status: "active" },
          { userBId: senderId, status: "active" },
        ],
      },
    });

    if (activePartnership) {
      const partnerId = activePartnership.userAId === senderId
        ? activePartnership.userBId
        : activePartnership.userAId;

      // If messaging the partner directly — allowed
      if (receiverId === partnerId) {
        return { allowed: true };
      }

      // Messaging anyone else — blocked
      return {
        allowed: false,
        status: 403,
        error: "You are in an active exclusive partnership. You can only message your partner.",
      };
    }

    // No active partnership blocking — allowed
    return { allowed: true };
  } catch {
    return { allowed: false, status: 500, error: "Unable to verify conversation status. Please try again." };
  }
}

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, content, replyToId } = req.body;

    // Shared validation: self-check, verification, active, restriction, block
    const validation = await validateSender(senderId, receiverId);
    if (!validation.ok) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Profanity filter
    if (containsProfanity(content || "")) {
      return res.status(400).json({ error: "Message contains inappropriate language and cannot be sent." });
    }

    // Contact info filter — block phone numbers and social media handles
    if (containsContactInfo(content || "")) {
      return res.status(400).json({ error: "For your safety, sharing phone numbers, social media handles, or external links is not allowed. Please keep all communication within the platform." });
    }

    if (replyToId) {
      const replyToMsg = await prisma.message.findUnique({ where: { id: replyToId } });
      if (!replyToMsg) return res.status(400).json({ error: "Message to reply to not found" });
    }

    // One active conversation rule (based on ExclusivePartnership)
    const convCheck = await checkOneConversationRule(senderId, receiverId);
    if (!convCheck.allowed) {
      return res.status(convCheck.status).json({ error: convCheck.error });
    }

    // Credits are now deducted when a ConversationRequest is accepted, not per message.
    // No credit check needed here.

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        replyToId: replyToId || null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
        replyTo: { select: { id: true, content: true, senderId: true, sender: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    emitNewMessage(message, receiverId);
    sendPushForMessage(message, receiverId);

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
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Get unread message IDs before marking them as read
    const unreadMessages = await prisma.message.findMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      select: { id: true },
    });

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    // Emit read receipts to the sender for each message that was marked as read
    for (const msg of unreadMessages) {
      emitMessageRead(msg.id, otherUserId, otherUserId);
    }

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
      take: 200, // Limit to recent 200 messages for conversation list
    });

    const conversations = {};
    const otherUserIds = new Set();

    // Check if the requesting user has Platinum membership or last_seen_visibility feature
    const canSeeLastSeen = await hasFeature(userId, "last_seen_visibility");

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
          user: { ...otherUser, lastLoginAt: canSeeLastSeen ? (otherUser.lastLoginAt || undefined) : undefined, membershipPlan },
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

const editMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    if (message.deletedForSender || message.deletedForReceiver) {
      return res.status(400).json({ error: "Cannot edit a deleted message" });
    }

    // Block contact info in edited messages
    if (containsContactInfo(content || "")) {
      return res.status(400).json({ error: "For your safety, sharing phone numbers, social media handles, or external links is not allowed." });
    }

    // Block profanity in edited messages
    if (containsProfanity(content)) {
      return res.status(400).json({ error: "Message contains inappropriate language and cannot be edited." });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, username: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, username: true } },
        replyTo: { select: { id: true, content: true, senderId: true, sender: { select: { id: true, firstName: true, lastName: true, username: true } } } },
      },
    });

    emitMessageEdited(updated, [message.senderId, message.receiverId]);

    res.json({ message: "Message edited successfully", updatedMessage: updated });
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({ error: "Failed to edit message" });
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

    // Shared validation: self-check, verification, active, restriction, block
    const validation = await validateSender(senderId, receiverId);
    if (!validation.ok) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Profanity filter on caption
    if (caption && containsProfanity(caption)) {
      return res.status(400).json({ error: "Caption contains inappropriate language and cannot be sent." });
    }

    // Contact info filter on caption
    if (caption && containsContactInfo(caption)) {
      return res.status(400).json({ error: "For your safety, sharing phone numbers, social media handles, or external links is not allowed." });
    }

    // One active conversation rule
    const convCheck = await checkOneConversationRule(senderId, receiverId);
    if (!convCheck.allowed) {
      return res.status(convCheck.status).json({ error: convCheck.error });
    }

    // Credit check: only deduct for brand-new conversations
    const isNew = await isNewConversation(senderId, receiverId);
    const creditResult = await checkAndDeductCredit(senderId, isNew);
    if (!creditResult.ok) {
      return res.status(creditResult.status).json({ error: creditResult.error });
    }

    let imageUrl;
    if (isR2Enabled()) {
      imageUrl = await uploadMulterFile(req.file, "chat-images");
    } else {
      imageUrl = "uploads/chat-images/" + req.file.filename;
    }
    const content = caption ? `IMG:${imageUrl}|${caption}` : `IMG:${imageUrl}`;
    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    emitNewMessage(message, receiverId);
    sendPushForMessage(message, receiverId);
    res.status(201).json({ message, creditsUsed: creditResult.creditsUsed, creditsRemaining: creditResult.creditsRemaining });
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

    // Shared validation: self-check, verification, active, restriction, block
    const validation = await validateSender(senderId, receiverId);
    if (!validation.ok) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Profanity filter on caption
    if (caption && containsProfanity(caption)) {
      return res.status(400).json({ error: "Caption contains inappropriate language and cannot be sent." });
    }

    // Contact info filter on caption
    if (caption && containsContactInfo(caption)) {
      return res.status(400).json({ error: "For your safety, sharing phone numbers, social media handles, or external links is not allowed." });
    }

    // One active conversation rule
    const convCheck = await checkOneConversationRule(senderId, receiverId);
    if (!convCheck.allowed) {
      return res.status(convCheck.status).json({ error: convCheck.error });
    }

    // Credit check: only deduct for brand-new conversations
    const isNew = await isNewConversation(senderId, receiverId);
    const creditResult = await checkAndDeductCredit(senderId, isNew);
    if (!creditResult.ok) {
      return res.status(creditResult.status).json({ error: creditResult.error });
    }

    let fileUrl;
    if (isR2Enabled()) {
      fileUrl = await uploadMulterFile(req.file, "chat-files");
    } else {
      fileUrl = "uploads/chat-files/" + req.file.filename;
    }
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
    sendPushForMessage(message, receiverId);
    res.status(201).json({ message, creditsUsed: creditResult.creditsUsed, creditsRemaining: creditResult.creditsRemaining });
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

// Get active chat partners for a specific user (public, for profile/match display)
// Only counts two-way conversations where both users messaged each other within the last 7 days
const getActiveChatPartners = async (req, res) => {
  try {
    const { userId } = req.params;
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Step 1: Users that this person sent messages to recently
    const sentRecent = await prisma.message.findMany({
      where: {
        senderId: userId,
        createdAt: { gte: activeSince },
      },
      select: { receiverId: true },
      distinct: ["receiverId"],
    });
    const sentTo = new Set(sentRecent.map((m) => m.receiverId));

    // Step 2: Users that sent messages to this person recently
    const receivedRecent = await prisma.message.findMany({
      where: {
        receiverId: userId,
        createdAt: { gte: activeSince },
      },
      select: { senderId: true },
      distinct: ["senderId"],
    });
    const receivedFrom = new Set(receivedRecent.map((m) => m.senderId));

    // Step 3: Only keep partners where BOTH sides messaged (two-way conversation)
    const partnerIds = [...sentTo].filter((id) => receivedFrom.has(id));

    console.log(`[ActivePartners] userId=${userId} sentTo=${sentTo.size} receivedFrom=${receivedFrom.size} mutual=${partnerIds.length}`);

    if (partnerIds.length === 0) {
      return res.json({ partners: [], count: 0 });
    }

    // Step 4: Get partner details — exclude admin users and soft-deleted users
    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds }, role: { not: "admin" }, isDeleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        isVerified: true,
        subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, select: { planType: true }, take: 1 },
        profile: { select: { photos: true } },
      },
    });

    res.json({
      partners: partners.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        username: p.username,
        isVerified: p.isVerified,
        membershipPlan: p.subscriptions?.length > 0 ? p.subscriptions[0].planType : null,
        photo: p.profile?.photos?.[0] || null,
      })),
      count: partners.length,
    });
  } catch (error) {
    console.error("Get active chat partners error:", error);
    res.status(500).json({ error: "Failed to get chat partners" });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { reaction } = req.body;

    const VALID_REACTIONS = ["❤️", "😂", "👍", "👎", "😢", "🤲"];
    if (!VALID_REACTIONS.includes(reaction)) {
      return res.status(400).json({ error: "Invalid reaction" });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.senderId !== userId && message.receiverId !== userId) {
      return res.status(403).json({ error: "You are not part of this conversation" });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reaction, reactionBy: userId, reactionAt: new Date() },
    });

    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
    emitMessageReaction(messageId, reaction, userId, [userId, otherUserId]);

    res.json({ message: "Reaction added", reaction, messageId });
  } catch (error) {
    console.error("React to message error:", error);
    res.status(500).json({ error: "Failed to react to message" });
  }
};

module.exports = {
  sendMessage,
  sendImage,
  sendFile,
  sendMessageToAdmin,
  getConversation,
  getConversations,
  getActiveChatPartners,
  markAsRead,
  editMessage,
  deleteMessage,
  blockUser,
  unblockUser,
  deleteConversation,
  reactToMessage,
};