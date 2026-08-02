const prisma = require("../config/database");
const { ensureContactCredits } = require("./membershipPlanController");

/**
 * Check if user has Gold, Platinum, or at least 1 conversation credit.
 * Returns { ok: true, usingCredits: boolean } or { ok: false, error }.
 */
async function checkMembershipOrCredits(userId) {
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      planType: { in: ["gold", "platinum"] },
      endDate: { gt: new Date() },
    },
    select: { planType: true },
  });
  if (activeSub) return { ok: true, usingCredits: false };

  const creditRecord = await ensureContactCredits(userId);
  if (creditRecord.credits > 0) return { ok: true, usingCredits: true };

  return {
    ok: false,
    status: 403,
    error:
      "You need either:\n\u2022 Gold Membership\n\u2022 Platinum Membership\n\u2022 or one Conversation Credit\nto start a conversation.",
  };
}

/**
 * Deduct 1 conversation credit from a user (only for free users using credits).
 */
async function deductConversationCredit(userId) {
  await prisma.userContactCredit.update({
    where: { userId },
    data: { credits: { decrement: 1 }, usedCredits: { increment: 1 } },
  });
}

// Stage 2+3: Create a conversation request (after membership/credit validation)
const createConversationRequest = async (req, res) => {
  try {
    const requesterId = req.user.userId;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }
    if (requesterId === receiverId) {
      return res.status(400).json({ error: "You cannot start a conversation with yourself" });
    }

    // Verify receiver exists, is verified, and not deleted
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isVerified: true, isActive: true, isDeleted: true },
    });
    if (!receiver || !receiver.isActive || receiver.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!receiver.isVerified) {
      return res.status(403).json({ error: "You can only start conversations with verified users." });
    }

    // Check for blocked
    const blocked = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: receiverId, blockedId: requesterId } },
    }).catch(() => null);
    if (blocked) {
      return res.status(403).json({ error: "You cannot start a conversation with this user." });
    }

    // --- Exclusive Partnership enforcement ---
    // If the requester is in an active exclusive partnership, they must have
    // an approved ConversationPermission from their partner for this target user.
    const activePartnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: requesterId, status: "active" },
          { userBId: requesterId, status: "active" },
        ],
      },
      select: { id: true, userAId: true, userBId: true },
    });
    if (activePartnership) {
      const partnerId = activePartnership.userAId === requesterId
        ? activePartnership.userBId
        : activePartnership.userAId;

      // Allow if the target user IS the partner (they can always talk to each other)
      if (receiverId !== partnerId) {
        const permission = await prisma.conversationPermission.findUnique({
          where: {
            requesterId_partnerId_targetUserId: {
              requesterId,
              partnerId,
              targetUserId: receiverId,
            },
          },
          select: { status: true },
        });
        if (!permission || permission.status !== "approved") {
          return res.status(403).json({
            error: "You are in an exclusive partnership. You must request and receive approval from your partner before starting a new conversation with this user.",
            code: "PARTNERSHIP_PERMISSION_REQUIRED",
            partnerId,
          });
        }
      }
    }

    // Stage 2: Membership / Credit validation
    const validation = await checkMembershipOrCredits(requesterId);
    if (!validation.ok) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Check for existing request between these two users
    const existing = await prisma.conversationRequest.findUnique({
      where: { requesterId_receiverId: { requesterId, receiverId } },
    });
    if (existing && existing.status === "accepted") {
      return res.json({ message: "Conversation already started", request: existing });
    }
    if (existing && existing.status === "pending") {
      return res.status(409).json({ error: "A conversation request is already pending.", request: existing });
    }
    // If there's a declined or expired request, allow re-requesting by upserting
    const request = await prisma.conversationRequest.upsert({
      where: { requesterId_receiverId: { requesterId, receiverId } },
      update: { status: "pending", message: message || null, respondedAt: null },
      create: {
        requesterId,
        receiverId,
        message: message || null,
      },
    });

    // Notify the receiver
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { firstName: true, lastName: true },
    });
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "conversation_request",
        title: "New Conversation Request",
        body: `${requester?.firstName} ${requester?.lastName} would like to start a conversation with you.`,
      },
    });

    res.status(201).json({ message: "Conversation request sent", request });
  } catch (error) {
    console.error("Create conversation request error:", error);
    res.status(500).json({ error: "Failed to send conversation request" });
  }
};

// Stage 4: Receiver accepts or declines
const respondToConversationRequest = async (req, res) => {
  try {
    const receiverId = req.user.userId;
    const { requestId } = req.params;
    const { status } = req.body; // "accepted" or "declined"

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'declined'" });
    }

    const request = await prisma.conversationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return res.status(404).json({ error: "Conversation request not found" });
    }
    if (request.receiverId !== receiverId) {
      return res.status(403).json({ error: "Only the receiver can respond to this request" });
    }
    if (request.status === "expired") {
      return res.status(410).json({ error: "This conversation request has expired." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ error: "This request has already been responded to" });
    }

    const updated = await prisma.conversationRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });

    if (status === "accepted") {
      // Deduct credit ONLY if the requester is using credits (not Gold/Platinum)
      const validation = await checkMembershipOrCredits(request.requesterId);
      if (validation.ok && validation.usingCredits) {
        await deductConversationCredit(request.requesterId);
      }
    }

    // Notify the requester
    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        type: "conversation_request_response",
        title: status === "accepted" ? "Conversation Request Accepted" : "Conversation Request Declined",
        body:
          status === "accepted"
            ? "Your conversation request has been accepted. You can now start messaging."
            : "Your conversation request has been declined.",
      },
    });

    res.json({ message: `Conversation request ${status}`, request: updated });
  } catch (error) {
    console.error("Respond to conversation request error:", error);
    res.status(500).json({ error: "Failed to respond to conversation request" });
  }
};

// Get received conversation requests (for the current user)
const getReceivedRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { receiverId: userId };
    if (status && ["pending", "accepted", "declined"].includes(status)) {
      where.status = status;
    }

    const requests = await prisma.conversationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isVerified: true,
            profile: { select: { photos: true, city: true, country: true, occupation: true } },
          },
        },
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error("Get received conversation requests error:", error);
    res.status(500).json({ error: "Failed to get conversation requests" });
  }
};

// Get sent conversation requests (by the current user)
const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { requesterId: userId };
    if (status && ["pending", "accepted", "declined"].includes(status)) {
      where.status = status;
    }

    const requests = await prisma.conversationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isVerified: true,
            profile: { select: { photos: true, city: true, country: true, occupation: true } },
          },
        },
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error("Get sent conversation requests error:", error);
    res.status(500).json({ error: "Failed to get conversation requests" });
  }
};

// Check if a conversation request exists between current user and a target user
const checkRequestStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.params;

    const sent = await prisma.conversationRequest.findUnique({
      where: { requesterId_receiverId: { requesterId: userId, receiverId: targetUserId } },
    });
    const received = await prisma.conversationRequest.findUnique({
      where: { requesterId_receiverId: { requesterId: targetUserId, receiverId: userId } },
    });

    res.json({ sent, received });
  } catch (error) {
    console.error("Check request status error:", error);
    res.status(500).json({ error: "Failed to check request status" });
  }
};

module.exports = {
  createConversationRequest,
  respondToConversationRequest,
  getReceivedRequests,
  getSentRequests,
  checkRequestStatus,
  checkMembershipOrCredits,
  deductConversationCredit,
};
