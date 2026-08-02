const prisma = require("../config/database");
const { autoRevokeWaliInvitation } = require("../utils/waliRevoke");

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// ============================================================
// Stage 1: Request Exclusive Marriage Process
// Rules:
//   - 7-day cooldown per requester (regardless of outcome)
//   - Receiver can receive unlimited requests
//   - Neither user can have an active partnership
//   - Must have prior conversation
//   - Old requests kept for history (never deleted)
// ============================================================
const requestExclusivePartnership = async (req, res) => {
  try {
    const requesterId = req.user.userId;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }
    if (requesterId === receiverId) {
      return res.status(400).json({ error: "You cannot request a partnership with yourself" });
    }

    // --- Block check: neither user should have blocked the other ---
    const blockExists = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: requesterId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: requesterId },
        ],
      },
    });
    if (blockExists) {
      return res.status(403).json({ error: "You cannot request a partnership with this user." });
    }

    // --- 7-day cooldown check ---
    const lastRequest = await prisma.exclusivePartnershipRequest.findFirst({
      where: { requesterId },
      orderBy: { createdAt: "desc" },
    });
    if (lastRequest) {
      const elapsed = Date.now() - lastRequest.createdAt.getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
        const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        const cooldownEnds = new Date(lastRequest.createdAt.getTime() + COOLDOWN_MS).toISOString();
        return res.status(429).json({
          error: `You can send a new partnership request in ${remainingDays}d ${remainingHours}h ${remainingMinutes}m.`,
          cooldownEnds,
          remainingMs,
        });
      }
    }

    // --- Check active partnership for either user ---
    const existingPartnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: requesterId, status: "active" },
          { userBId: requesterId, status: "active" },
          { userAId: receiverId, status: "active" },
          { userBId: receiverId, status: "active" },
        ],
      },
    });
    if (existingPartnership) {
      return res.status(403).json({ error: "One of you already has an active exclusive partnership." });
    }

    // --- Verify prior conversation ---
    const priorMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: requesterId, receiverId: receiverId },
          { senderId: receiverId, receiverId: requesterId },
        ],
      },
    });
    if (priorMessages === 0) {
      return res.status(403).json({ error: "You can only request an exclusive partnership with someone you are already in a conversation with." });
    }

    // --- Create new request (never overwrite old ones) ---
    const request = await prisma.exclusivePartnershipRequest.create({
      data: {
        requesterId,
        receiverId,
        message: message || null,
        status: "pending",
      },
    });

    // --- Notify the receiver ---
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { firstName: true, lastName: true },
    });
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "exclusive_partnership_request",
        title: "Exclusive Marriage Process Request",
        body: `${requester?.firstName} ${requester?.lastName} wants to continue the marriage process exclusively with you.`,
      },
    });

    res.status(201).json({ message: "Exclusive partnership request sent", request });
  } catch (error) {
    console.error("Request exclusive partnership error:", error);
    res.status(500).json({ error: "Failed to send partnership request" });
  }
};

// ============================================================
// Stage 2: Receiver accepts or declines
// Rules:
//   - Use transaction to prevent race conditions
//   - On accept: revalidate no active partnership for either user
//   - On accept: expire all OTHER pending requests received by the receiver (B→C, D→C)
//   - On accept: expire all OTHER pending requests sent BY the requester (A→X, A→Y)
//   - On accept: expire all pending requests sent BY the receiver (C→X, C→Y)
//   - On decline: just mark as declined
// ============================================================
const respondToPartnershipRequest = async (req, res) => {
  try {
    const receiverId = req.user.userId;
    const { requestId } = req.params;
    const { status } = req.body; // "accepted" or "declined"

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'declined'" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock the request row by finding it first
      const request = await tx.exclusivePartnershipRequest.findUnique({
        where: { id: requestId },
      });
      if (!request) {
        throw { code: 404, message: "Partnership request not found" };
      }
      if (request.receiverId !== receiverId) {
        throw { code: 403, message: "Only the receiver can respond to this request" };
      }
      if (request.status !== "pending") {
        throw { code: 400, message: "This request has already been responded to" };
      }

      if (status === "accepted") {
        // --- Block check: neither user should have blocked the other ---
        const blockExists = await tx.blockedUser.findFirst({
          where: {
            OR: [
              { blockerId: request.requesterId, blockedId: receiverId },
              { blockerId: receiverId, blockedId: request.requesterId },
            ],
          },
        });
        if (blockExists) {
          throw { code: 403, message: "You cannot accept a partnership request with this user due to a block." };
        }

        const userAId = request.requesterId;
        const userBId = request.receiverId;

        // --- Re-check that both users are still active (prevents race condition) ---
        const [requester, receiver] = await Promise.all([
          tx.user.findUnique({ where: { id: userAId }, select: { id: true, isActive: true, isDeleted: true } }),
          tx.user.findUnique({ where: { id: userBId }, select: { id: true, isActive: true, isDeleted: true } }),
        ]);
        if (!requester || !receiver || !requester.isActive || !receiver.isActive || requester.isDeleted || receiver.isDeleted) {
          // Expire the pending request since one user is no longer active
          await tx.exclusivePartnershipRequest.update({
            where: { id: requestId },
            data: { status: "expired", respondedAt: new Date() },
          });
          throw { code: 403, message: "This partnership request can no longer be accepted because one of the users is no longer active." };
        }

        // Revalidate: neither user has an active partnership
        const activePartnership = await tx.exclusivePartnership.findFirst({
          where: {
            OR: [
              { userAId, status: "active" },
              { userBId: userAId, status: "active" },
              { userAId: userBId, status: "active" },
              { userBId, status: "active" },
            ],
          },
        });
        if (activePartnership) {
          throw { code: 403, message: "One of you already has an active exclusive partnership." };
        }

        // Create or reactivate partnership
        const existing = await tx.exclusivePartnership.findUnique({
          where: { userAId_userBId: { userAId, userBId } },
        });
        if (existing) {
          await tx.exclusivePartnership.update({
            where: { id: existing.id },
            data: { status: "active", endedAt: null },
          });
        } else {
          await tx.exclusivePartnership.create({
            data: { userAId, userBId, status: "active" },
          });
        }

        // Expire all OTHER pending requests received by the receiver
        await tx.exclusivePartnershipRequest.updateMany({
          where: {
            receiverId,
            status: "pending",
            id: { not: requestId },
          },
          data: { status: "expired", respondedAt: new Date() },
        });

        // Expire all OTHER pending requests sent BY the requester (A→X, A→Y)
        await tx.exclusivePartnershipRequest.updateMany({
          where: {
            requesterId: request.requesterId,
            status: "pending",
            id: { not: requestId },
          },
          data: { status: "expired", respondedAt: new Date() },
        });

        // Expire all OTHER pending requests sent BY the receiver (C→X, C→Y)
        await tx.exclusivePartnershipRequest.updateMany({
          where: {
            requesterId: receiverId,
            status: "pending",
          },
          data: { status: "expired", respondedAt: new Date() },
        });
      }

      // Update this request's status
      const updated = await tx.exclusivePartnershipRequest.update({
        where: { id: requestId },
        data: { status, respondedAt: new Date() },
      });

      return updated;
    });

    // Notify the requester (outside transaction)
    await prisma.notification.create({
      data: {
        userId: result.requesterId,
        type: "exclusive_partnership_response",
        title: status === "accepted" ? "Partnership Accepted" : "Partnership Declined",
        body:
          status === "accepted"
            ? "Your exclusive marriage process request has been accepted. You are now exclusive partners."
            : "Your exclusive marriage process request has been declined.",
      },
    });

    // --- Notify all users with active conversations that chats are now read-only ---
    if (status === "accepted") {
      const userAId = result.requesterId;
      const userBId = result.receiverId;

      // Get names for both partners
      const [userA, userB] = await Promise.all([
        prisma.user.findUnique({ where: { id: userAId }, select: { firstName: true, lastName: true } }),
        prisma.user.findUnique({ where: { id: userBId }, select: { firstName: true, lastName: true } }),
      ]);

      // Find all users who have exchanged messages with EITHER partner (excluding each other and admins)
      for (const [partnerId, partnerName, otherPartnerId] of [
        [userAId, userA, userBId],
        [userBId, userB, userAId],
      ]) {
        // Users who received messages FROM this partner
        const sentTo = await prisma.message.findMany({
          where: { senderId: partnerId, receiverId: { not: otherPartnerId } },
          select: { receiverId: true },
          distinct: ["receiverId"],
        });
        // Users who sent messages TO this partner
        const receivedFrom = await prisma.message.findMany({
          where: { receiverId: partnerId, senderId: { not: otherPartnerId } },
          select: { senderId: true },
          distinct: ["senderId"],
        });

        // Combine unique conversation partner IDs
        const conversationUserIds = [...new Set([
          ...sentTo.map((m) => m.receiverId),
          ...receivedFrom.map((m) => m.senderId),
        ])];

        // Notify each conversation partner
        for (const otherUserId of conversationUserIds) {
          // Skip admins
          const otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: { role: true },
          });
          if (!otherUser || otherUser.role === "admin") continue;

          await prisma.notification.create({
            data: {
              userId: otherUserId,
              type: "conversation_read_only",
              title: "Conversation Now Read-Only",
              body: `${partnerName?.firstName} ${partnerName?.lastName} has entered an Exclusive Marriage Process. This conversation is now read-only until the partnership ends.`,
            },
          });
        }
      }
    }

    res.json({ message: "Partnership request " + status, request: result });
  } catch (error) {
    if (error.code && error.message) {
      return res.status(error.code).json({ error: error.message });
    }
    // Handle DB-level unique constraint violation (partial unique index on active partnerships)
    if (error.code === "P2002") {
      return res.status(403).json({ error: "One of you already has an active exclusive partnership." });
    }
    console.error("Respond to partnership request error:", error);
    res.status(500).json({ error: "Failed to respond to partnership request" });
  }
};

// ============================================================
// Stage 3: Cancel a sent request (requester only)
// Rules:
//   - Only the requester can cancel
//   - Only pending requests can be cancelled
//   - Cooldown still applies (does NOT reset)
// ============================================================
const cancelPartnershipRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const request = await prisma.exclusivePartnershipRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return res.status(404).json({ error: "Partnership request not found" });
    }
    if (request.requesterId !== userId) {
      return res.status(403).json({ error: "Only the requester can cancel this request" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Only pending requests can be cancelled" });
    }

    const updated = await prisma.exclusivePartnershipRequest.update({
      where: { id: requestId },
      data: { status: "cancelled", respondedAt: new Date() },
    });

    // Notify the receiver
    await prisma.notification.create({
      data: {
        userId: request.receiverId,
        type: "exclusive_partnership_cancelled",
        title: "Partnership Request Cancelled",
        body: "The exclusive marriage process request has been cancelled by the sender.",
      },
    });

    res.json({ message: "Partnership request cancelled", request: updated });
  } catch (error) {
    console.error("Cancel partnership request error:", error);
    res.status(500).json({ error: "Failed to cancel partnership request" });
  }
};

// ============================================================
// Stage 4: End Exclusive Partnership
// ============================================================
const endPartnership = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnershipId } = req.params;

    const partnership = await prisma.exclusivePartnership.findUnique({
      where: { id: partnershipId },
    });
    if (!partnership) {
      return res.status(404).json({ error: "Partnership not found" });
    }
    if (partnership.userAId !== userId && partnership.userBId !== userId) {
      return res.status(403).json({ error: "You are not part of this partnership" });
    }
    if (partnership.status !== "active") {
      return res.status(400).json({ error: "This partnership is not active" });
    }

    const updated = await prisma.exclusivePartnership.update({
      where: { id: partnershipId },
      data: { status: "ended", endedAt: new Date() },
    });

    // Auto-revoke any active or pending Wali invitation
    await autoRevokeWaliInvitation(partnershipId, "partnership_ended", userId);

    const otherUserId = partnership.userAId === userId ? partnership.userBId : partnership.userAId;

    // Expire all pending ConversationPermission requests between these two partners
    await prisma.conversationPermission.updateMany({
      where: {
        OR: [
          { requesterId: userId, partnerId: otherUserId, status: "pending" },
          { requesterId: otherUserId, partnerId: userId, status: "pending" },
        ],
      },
      data: { status: "expired", respondedAt: new Date() },
    });

    // Notify the other partner
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "exclusive_partnership_ended",
        title: "Exclusive Marriage Process Ended",
        body: `${user?.firstName} ${user?.lastName} has ended the exclusive marriage process. You are both free to start new conversations.`,
      },
    });

    res.json({ message: "Partnership ended", partnership: updated });
  } catch (error) {
    console.error("End partnership error:", error);
    res.status(500).json({ error: "Failed to end partnership" });
  }
};

// ============================================================
// Get current user's active partnership
// ============================================================
const getMyPartnership = async (req, res) => {
  try {
    const userId = req.user.userId;

    const partnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: userId, status: "active" },
          { userBId: userId, status: "active" },
        ],
      },
      include: {
        userA: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
        userB: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
      },
    });

    res.json({ partnership });
  } catch (error) {
    console.error("Get my partnership error:", error);
    res.status(500).json({ error: "Failed to get partnership" });
  }
};

// ============================================================
// Get received partnership requests
// ============================================================
const getReceivedPartnershipRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { receiverId: userId };
    if (status && ["pending", "accepted", "declined", "expired", "cancelled"].includes(status)) {
      where.status = status;
    }

    const requests = await prisma.exclusivePartnershipRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error("Get received partnership requests error:", error);
    res.status(500).json({ error: "Failed to get partnership requests" });
  }
};

// ============================================================
// Get sent partnership requests
// ============================================================
const getSentPartnershipRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { requesterId: userId };
    if (status && ["pending", "accepted", "declined", "expired", "cancelled"].includes(status)) {
      where.status = status;
    }

    const requests = await prisma.exclusivePartnershipRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error("Get sent partnership requests error:", error);
    res.status(500).json({ error: "Failed to get partnership requests" });
  }
};

// ============================================================
// Check partnership status between current user and a target user
// ============================================================
const checkPartnershipStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.params;

    const partnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: targetUserId },
          { userAId: targetUserId, userBId: userId },
        ],
      },
    });

    // Get the most recent request between these two users (either direction)
    const sentRequest = await prisma.exclusivePartnershipRequest.findFirst({
      where: { requesterId: userId, receiverId: targetUserId },
      orderBy: { createdAt: "desc" },
    });
    const receivedRequest = await prisma.exclusivePartnershipRequest.findFirst({
      where: { requesterId: targetUserId, receiverId: userId },
      orderBy: { createdAt: "desc" },
    });

    // Check cooldown status for the current user
    const lastSentRequest = await prisma.exclusivePartnershipRequest.findFirst({
      where: { requesterId: userId },
      orderBy: { createdAt: "desc" },
    });
    let cooldown = null;
    if (lastSentRequest) {
      const elapsed = Date.now() - lastSentRequest.createdAt.getTime();
      if (elapsed < COOLDOWN_MS) {
        cooldown = {
          active: true,
          endsAt: new Date(lastSentRequest.createdAt.getTime() + COOLDOWN_MS).toISOString(),
          remainingMs: COOLDOWN_MS - elapsed,
        };
      } else {
        cooldown = { active: false };
      }
    } else {
      cooldown = { active: false };
    }

    res.json({ partnership, sentRequest, receivedRequest, cooldown });
  } catch (error) {
    console.error("Check partnership status error:", error);
    res.status(500).json({ error: "Failed to check partnership status" });
  }
};

module.exports = {
  requestExclusivePartnership,
  respondToPartnershipRequest,
  cancelPartnershipRequest,
  endPartnership,
  getMyPartnership,
  getReceivedPartnershipRequests,
  getSentPartnershipRequests,
  checkPartnershipStatus,
};
