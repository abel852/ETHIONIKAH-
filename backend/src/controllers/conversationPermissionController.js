const prisma = require("../config/database");

// Request permission from a current conversation partner to talk to a new user
const requestPermission = async (req, res) => {
  try {
    const requesterId = req.user.userId;
    const { partnerId, targetUserId, message } = req.body;

    if (!partnerId || !targetUserId) {
      return res.status(400).json({ error: "partnerId and targetUserId are required" });
    }
    if (partnerId === targetUserId) {
      return res.status(400).json({ error: "Partner and target user cannot be the same" });
    }
    if (requesterId === partnerId || requesterId === targetUserId) {
      return res.status(400).json({ error: "You cannot request permission from yourself" });
    }

    // Verify the requester has an ACTIVE ExclusivePartnership with the partner
    const partnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: requesterId, userBId: partnerId, status: "active" },
          { userAId: partnerId, userBId: requesterId, status: "active" },
        ],
      },
    });
    if (!partnership) {
      return res.status(403).json({ error: "You can only request permission from your active exclusive partner." });
    }

    // Check if a permission request already exists
    const existing = await prisma.conversationPermission.findUnique({
      where: {
        requesterId_partnerId_targetUserId: { requesterId, partnerId, targetUserId },
      },
    });
    if (existing && existing.status === "approved") {
      return res.json({ message: "Permission already granted", permission: existing });
    }
    if (existing && existing.status === "pending") {
      return res.status(409).json({ error: "A permission request is already pending.", permission: existing });
    }

    // Create or re-create the permission request
    const permission = await prisma.conversationPermission.upsert({
      where: {
        requesterId_partnerId_targetUserId: { requesterId, partnerId, targetUserId },
      },
      update: { status: "pending", message: message || null, respondedAt: null },
      create: {
        requesterId,
        partnerId,
        targetUserId,
        message: message || null,
      },
    });

    // Notify the partner
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { firstName: true, lastName: true },
    });
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { firstName: true, lastName: true },
    });

    await prisma.notification.create({
      data: {
        userId: partnerId,
        type: "conversation_permission_request",
        title: "Permission Request",
        body: `${requester?.firstName} ${requester?.lastName} is asking for your permission to start a conversation with ${target?.firstName} ${target?.lastName}.`,
      },
    });

    res.status(201).json({ message: "Permission request sent", permission });
  } catch (error) {
    console.error("Request permission error:", error);
    res.status(500).json({ error: "Failed to send permission request" });
  }
};

// Approve or deny a permission request
const respondToPermission = async (req, res) => {
  try {
    const partnerId = req.user.userId;
    const { permissionId } = req.params;
    const { status } = req.body; // "approved" or "denied"

    if (!["approved", "denied"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'denied'" });
    }

    const permission = await prisma.conversationPermission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      return res.status(404).json({ error: "Permission request not found" });
    }
    if (permission.partnerId !== partnerId) {
      return res.status(403).json({ error: "Only the partner can respond to this request" });
    }
    if (permission.status !== "pending") {
      return res.status(400).json({ error: "This request has already been responded to" });
    }

    const updated = await prisma.conversationPermission.update({
      where: { id: permissionId },
      data: { status, respondedAt: new Date() },
    });

    // Notify the requester
    await prisma.notification.create({
      data: {
        userId: permission.requesterId,
        type: "conversation_permission_response",
        title: status === "approved" ? "Permission Granted" : "Permission Denied",
        body: status === "approved"
          ? "Your request to start a new conversation has been approved."
          : "Your request to start a new conversation has been denied.",
      },
    });

    res.json({ message: `Permission ${status}`, permission: updated });
  } catch (error) {
    console.error("Respond to permission error:", error);
    res.status(500).json({ error: "Failed to respond to permission request" });
  }
};

// Get all permission requests received by the current user (as partner)
const getReceivedPermissions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { partnerId: userId };
    if (status && ["pending", "approved", "denied"].includes(status)) {
      where.status = status;
    }

    const permissions = await prisma.conversationPermission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
        targetUser: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
      },
    });

    res.json({ permissions });
  } catch (error) {
    console.error("Get received permissions error:", error);
    res.status(500).json({ error: "Failed to get permission requests" });
  }
};

// Get all permission requests made by the current user (as requester)
const getSentPermissions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { requesterId: userId };
    if (status && ["pending", "approved", "denied"].includes(status)) {
      where.status = status;
    }

    const permissions = await prisma.conversationPermission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        partner: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
        targetUser: {
          select: { id: true, firstName: true, lastName: true, username: true, profile: { select: { photos: true } } },
        },
      },
    });

    res.json({ permissions });
  } catch (error) {
    console.error("Get sent permissions error:", error);
    res.status(500).json({ error: "Failed to get permission requests" });
  }
};

module.exports = {
  requestPermission,
  respondToPermission,
  getReceivedPermissions,
  getSentPermissions,
};
