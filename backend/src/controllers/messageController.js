const prisma = require("../config/database");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, content } = req.body;

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

    const existingConversations = await prisma.message.findFirst({
      where: { senderId, NOT: { receiverId } },
    });
    if (existingConversations) {
      return res.status(403).json({ error: "You can only message one person at a time. Complete or withdraw your current conversation before starting a new one." });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

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

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ messages });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                photos: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                photos: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const conversations = {};
    messages.forEach((msg) => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        };
      }

      if (msg.receiverId === userId && !msg.isRead) {
        conversations[otherUserId].unreadCount++;
      }
    });

    res.json({ conversations: Object.values(conversations) });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    const message = await prisma.message.updateMany({
      where: {
        id: messageId,
        receiverId: userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

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

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { blockedUserId } = req.body;

    res.json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  deleteMessage,
  blockUser,
};
