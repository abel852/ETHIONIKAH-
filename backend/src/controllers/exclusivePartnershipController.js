const prisma = require("../config/database");

// Stage 6: Request Exclusive Marriage Process
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

    // Verify both users have an active conversation (messages between them)
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

    // Check if either user already has an active partnership
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

    // Check for existing pending request between these two users
    const existing = await prisma.exclusivePartnershipRequest.findUnique({
      where: { requesterId_receiverId: { requesterId, receiverId } },
    });
    if (existing && existing.status === "accepted") {
      return res.json({ message: "Partnership already established", request: existing });
    }
    if (existing && existing.status === "pending") {
      return res.status(409).json({ error: "A partnership request is already pending.", request: existing });
    }

    const request = await prisma.exclusivePartnershipRequest.upsert({
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

// Stage 7: Receiver accepts or declines
const respondToPartnershipRequest = async (req, res) => {
  try {
    const receiverId = req.user.userId;
    const { requestId } = req.params;
    const { status } = req.body; // "accepted" or "declined"

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'declined'" });
    }

    const request = await prisma.exclusivePartnershipRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return res.status(404).json({ error: "Partnership request not found" });
    }
    if (request.receiverId !== receiverId) {
      return res.status(403).json({ error: "Only the receiver can respond to this request" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ error: "This request has already been responded to" });
    }

    const updated = await prisma.exclusivePartnershipRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });

    if (status === "accepted") {
      // Create the ExclusivePartnership
      const userAId = request.requesterId;
      const userBId = request.receiverId;

      // Check if a partnership already exists (edge case)
      const existing = await prisma.exclusivePartnership.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (existing) {
        await prisma.exclusivePartnership.update({
          where: { id: existing.id },
          data: { status: "active", endedAt: null },
        });
      } else {
        await prisma.exclusivePartnership.create({
          data: { userAId, userBId, status: "active" },
        });
      }
    }

    // Notify the requester
    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        type: "exclusive_partnership_response",
        title: status === "accepted" ? "Partnership Accepted" : "Partnership Declined",
        body:
          status === "accepted"
            ? "Your exclusive marriage process request has been accepted. You are now exclusive partners."
            : "Your exclusive marriage process request has been declined.",
      },
    });

    res.json({ message: `Partnership request ${status}`, request: updated });
  } catch (error) {
    console.error("Respond to partnership request error:", error);
    res.status(500).json({ error: "Failed to respond to partnership request" });
  }
};

// Stage 9: End Exclusive Partnership
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

    // Notify the other partner
    const otherUserId = partnership.userAId === userId ? partnership.userBId : partnership.userAId;
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

// Get the current user's active partnership (if any)
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

// Get pending partnership requests (received by current user)
const getReceivedPartnershipRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { receiverId: userId };
    if (status && ["pending", "accepted", "declined"].includes(status)) {
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

// Get sent partnership requests (by current user)
const getSentPartnershipRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { requesterId: userId };
    if (status && ["pending", "accepted", "declined"].includes(status)) {
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

// Check partnership status between current user and a target user
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

    const sentRequest = await prisma.exclusivePartnershipRequest.findUnique({
      where: { requesterId_receiverId: { requesterId: userId, receiverId: targetUserId } },
    });
    const receivedRequest = await prisma.exclusivePartnershipRequest.findUnique({
      where: { requesterId_receiverId: { requesterId: targetUserId, receiverId: userId } },
    });

    res.json({ partnership, sentRequest, receivedRequest });
  } catch (error) {
    console.error("Check partnership status error:", error);
    res.status(500).json({ error: "Failed to check partnership status" });
  }
};

module.exports = {
  requestExclusivePartnership,
  respondToPartnershipRequest,
  endPartnership,
  getMyPartnership,
  getReceivedPartnershipRequests,
  getSentPartnershipRequests,
  checkPartnershipStatus,
};
