const prisma = require("../config/database");
const { ensureContactCredits } = require("./membershipPlanController");
const { getUserFeatures } = require("../utils/subscriptionHelper");

/**
 * Check if user has an active membership with messaging privileges (e.g., unlimited_messaging, no_credit_charges, Gold, Platinum),
 * or at least 1 conversation credit.
 * Returns { ok: true, usingCredits: boolean } or { ok: false, error }.
 */
async function checkMembershipOrCredits(userId) {
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      endDate: { gt: new Date() },
    },
    select: { planType: true },
  });
  if (activeSub) {
    if (["gold", "platinum"].includes(activeSub.planType)) {
      return { ok: true, usingCredits: false };
    }
    const features = await getUserFeatures(userId);
    if (
      features.includes("unlimited_messaging") ||
      features.includes("no_credit_charges") ||
      features.includes("instant_messaging")
    ) {
      return { ok: true, usingCredits: false };
    }
  }

  const creditRecord = await ensureContactCredits(userId);
  if (creditRecord.credits > 0) return { ok: true, usingCredits: true };

  return {
    ok: false,
    status: 403,
    code: "MEMBERSHIP_OR_CREDITS_REQUIRED",
    error:
      "You cannot start a conversation unless you have an active Membership or Conversation Credits. Please purchase credits or upgrade your plan.",
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

    // Verify requester exists, is verified, and active
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, firstName: true, lastName: true, isVerified: true, isActive: true, isDeleted: true },
    });
    if (!requester || !requester.isActive || requester.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!requester.isVerified) {
      return res.status(403).json({
        error: "Your account must be verified before you can start a conversation. Please complete the verification process.",
        code: "VERIFICATION_REQUIRED",
      });
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
    // If the requester is in an active exclusive partnership, they can only
    // start conversations with their partner. No new conversations with anyone else.
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

      if (receiverId !== partnerId) {
        return res.status(403).json({
          error: "You are in an active exclusive partnership. You cannot start new conversations with anyone except your partner.",
          code: "PARTNERSHIP_ACTIVE",
          partnerId,
        });
      }
    }

    // Stage 2: Membership / Credit validation
    const validation = await checkMembershipOrCredits(requesterId);
    if (!validation.ok) {
      return res.status(validation.status).json({
        error: validation.error,
        code: validation.code || "MEMBERSHIP_OR_CREDITS_REQUIRED",
      });
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
    // If request was declined, block another request for 15 days
    if (existing && existing.status === "declined") {
      const respondedAt = existing.respondedAt || existing.createdAt;
      const msPassed = Date.now() - new Date(respondedAt).getTime();
      const daysPassed = msPassed / (1000 * 60 * 60 * 24);
      if (daysPassed < 15) {
        const remainingDays = Math.ceil(15 - daysPassed);
        return res.status(403).json({
          error: `Your previous conversation request to this user was declined. You can send another request in ${remainingDays} day${remainingDays === 1 ? "" : "s"}.`,
          code: "DECLINED_COOLDOWN",
          remainingDays,
        });
      }
    }

    // If there's an expired or 15+ days declined request, allow re-requesting by upserting
    const request = await prisma.conversationRequest.upsert({
      where: { requesterId_receiverId: { requesterId, receiverId } },
      update: {
        status: "pending",
        message: message || null,
        createdAt: new Date(),
        respondedAt: null,
      },
      create: {
        requesterId,
        receiverId,
        message: message || null,
      },
    });

    // Deduct credit if user is using conversation credits
    if (validation.usingCredits) {
      await deductConversationCredit(requesterId);
    }

    // Notify the receiver
    const notification = await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "conversation_request",
        title: "New Conversation Request",
        body: `${requester?.firstName} ${requester?.lastName} sent you a conversation request to connect for chat.`,
      },
    });

    try {
      const { emitNotification } = require("../utils/messageSocket");
      emitNotification(receiverId, notification);
    } catch (_e) {}

    try {
      const { sendPushToUser } = require("../utils/pushService");
      sendPushToUser(receiverId, {
        title: "New Conversation Request",
        body: `${requester?.firstName} ${requester?.lastName} sent you a conversation request to connect for chat.`,
        type: "conversation_request",
        data: { url: "/messages" },
      });
    } catch (_e) {}

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

    // Verify receiver is verified and active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, firstName: true, lastName: true, isVerified: true, isActive: true },
    });
    if (!receiver || !receiver.isActive) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!receiver.isVerified) {
      return res.status(403).json({
        error: "Your account must be verified before you can respond to conversation requests.",
        code: "VERIFICATION_REQUIRED",
      });
    }

    // Verify requester is still verified and active
    const requester = await prisma.user.findUnique({
      where: { id: request.requesterId },
      select: { isVerified: true, isActive: true },
    });
    if (!requester || !requester.isActive || !requester.isVerified) {
      return res.status(403).json({ error: "The requester is no longer verified or active." });
    }

    // --- Exclusive Partnership enforcement ---
    // Block accepting if EITHER the receiver or the requester is in an active
    // exclusive partnership with someone else. Old pending requests cannot
    // sneak through after exclusivity starts.
    if (status === "accepted") {
      const [receiverPartnership, requesterPartnership] = await Promise.all([
        prisma.exclusivePartnership.findFirst({
          where: {
            OR: [
              { userAId: receiverId, status: "active" },
              { userBId: receiverId, status: "active" },
            ],
          },
          select: { userAId: true, userBId: true },
        }),
        prisma.exclusivePartnership.findFirst({
          where: {
            OR: [
              { userAId: request.requesterId, status: "active" },
              { userBId: request.requesterId, status: "active" },
            ],
          },
          select: { userAId: true, userBId: true },
        }),
      ]);

      if (receiverPartnership) {
        const receiverPartnerId = receiverPartnership.userAId === receiverId
          ? receiverPartnership.userBId
          : receiverPartnership.userAId;
        if (request.requesterId !== receiverPartnerId) {
          return res.status(403).json({ error: "You are in an active exclusive partnership. You cannot accept conversation requests from anyone except your partner." });
        }
      }

      if (requesterPartnership) {
        const requesterPartnerId = requesterPartnership.userAId === request.requesterId
          ? requesterPartnership.userBId
          : requesterPartnership.userAId;
        if (receiverId !== requesterPartnerId) {
          return res.status(403).json({ error: "This user is now in an active exclusive partnership and cannot start new conversations." });
        }
      }
    }

    const updated = await prisma.conversationRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });

    if (status === "accepted") {
      // Deduct credit ONLY if the requester is using credits (not Gold/Platinum)
      const validation = await checkMembershipOrCredits(request.requesterId);
      if (!validation.ok) {
        return res.status(403).json({
          error: "The requester no longer has an active Membership or Conversation Credits to start this conversation.",
          code: "PAYMENT_REQUIRED",
        });
      }
      if (validation.usingCredits) {
        await deductConversationCredit(request.requesterId);
      }
    }

    const receiverName = receiver?.firstName
      ? `${receiver.firstName} ${receiver.lastName || ""}`.trim()
      : "The recipient";

    // Notify the requester
    const responseNotif = await prisma.notification.create({
      data: {
        userId: request.requesterId,
        type: "conversation_request_response",
        title: status === "accepted" ? "Conversation Request Accepted" : "Conversation Request Declined",
        body:
          status === "accepted"
            ? `${receiverName} accepted your conversation request. You can now start chatting!`
            : `${receiverName} declined your conversation request. You can send another request in 15 days.`,
      },
    });

    try {
      const { emitNotification } = require("../utils/messageSocket");
      emitNotification(request.requesterId, responseNotif);
    } catch (_e) {}

    try {
      const { sendPushToUser } = require("../utils/pushService");
      sendPushToUser(request.requesterId, {
        title: status === "accepted" ? "Conversation Request Accepted" : "Conversation Request Declined",
        body:
          status === "accepted"
            ? `${receiverName} accepted your conversation request. You can now start chatting!`
            : `${receiverName} declined your conversation request. You can send another request in 15 days.`,
        type: "conversation_request_response",
        data: { url: "/messages" },
      });
    } catch (_e) {}

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

    let cooldownRemainingDays = 0;
    if (sent && sent.status === "declined" && (sent.respondedAt || sent.createdAt)) {
      const respondedAt = sent.respondedAt || sent.createdAt;
      const msPassed = Date.now() - new Date(respondedAt).getTime();
      const daysPassed = msPassed / (1000 * 60 * 60 * 24);
      if (daysPassed < 15) {
        cooldownRemainingDays = Math.ceil(15 - daysPassed);
      }
    }

    res.json({ sent, received, cooldownRemainingDays });
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
