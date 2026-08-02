const crypto = require("crypto");
const prisma = require("../config/database");
const { sendEmail, emailTemplate } = require("../utils/email");
const { createNotification } = require("../utils/notification");

const EXPIRY_DAYS = parseInt(process.env.WALI_INVITATION_EXPIRY_DAYS || "30", 10);
const APP_URL = process.env.APP_URL || "http://localhost:3000";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ============================================================
// Invite Wali — only allowed when ExclusivePartnership is active
// Automatically uses the female partner's registered Wali.
// No manual entry of Wali details — they come from the Wali table.
// ============================================================
const inviteWali = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnershipId } = req.body;

    if (!partnershipId) {
      return res.status(400).json({ error: "partnershipId is required" });
    }

    // Verify the partnership exists, is active, and the user is part of it
    const partnership = await prisma.exclusivePartnership.findUnique({
      where: { id: partnershipId },
      include: {
        userA: { select: { id: true, gender: true } },
        userB: { select: { id: true, gender: true } },
      },
    });

    if (!partnership) {
      return res.status(404).json({ error: "Exclusive partnership not found" });
    }

    if (partnership.status !== "active") {
      return res.status(403).json({ error: "You can only invite a Wali when the exclusive partnership is active." });
    }

    if (partnership.userAId !== userId && partnership.userBId !== userId) {
      return res.status(403).json({ error: "You are not part of this exclusive partnership" });
    }

    // Identify the female partner
    const femaleUser = partnership.userA.gender === "female" ? partnership.userA : partnership.userB;
    if (!femaleUser) {
      return res.status(400).json({ error: "No female partner found in this partnership. Wali is only applicable for female users." });
    }

    // Fetch the female's registered Wali
    const wali = await prisma.wali.findUnique({
      where: { femaleUserId: femaleUser.id },
    });

    if (!wali) {
      return res.status(400).json({ error: "The female partner has not registered a Wali. Please ask her to register a Wali in her profile first." });
    }

    // Check if there's already a pending_approval or active invitation
    const existing = await prisma.waliInvitation.findUnique({
      where: { partnershipId },
    });

    if (existing && (existing.status === "pending_approval" || existing.status === "active")) {
      return res.status(409).json({ error: "A Wali invitation is already in progress. Please revoke it first to create a new one." });
    }

    // Use upsert — if an old invitation exists (revoked/declined/expired), replace it
    const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await prisma.waliInvitation.upsert({
      where: { partnershipId },
      create: {
        partnershipId,
        createdById: userId,
        waliId: wali.id,
        secureTokenHash: "pending",
        expiresAt,
        status: "pending_approval",
      },
      update: {
        createdById: userId,
        waliId: wali.id,
        secureTokenHash: "pending",
        expiresAt,
        status: "pending_approval",
        revokedAt: null,
      },
    });

    // Notify the other partner to approve/decline
    const otherUserId = partnership.userAId === userId ? partnership.userBId : partnership.userAId;
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    await createNotification({
      userId: otherUserId,
      type: "wali_invitation_pending",
      title: "Wali Invitation Needs Approval",
      body: `${inviter?.firstName} ${inviter?.lastName} wants to invite ${wali.name} (${wali.relationship}) as a Wali to observe your conversation. Please approve or decline.`,
    });

    res.json({ message: "Wali invitation sent for partner approval", invitation: { id: invitation.id, waliId: wali.id, waliName: wali.name, relationship: wali.relationship, waliEmail: wali.email, status: "pending_approval", expiresAt } });
  } catch (error) {
    console.error("Invite Wali error:", error);
    res.status(500).json({ error: "Failed to send Wali invitation" });
  }
};

// ============================================================
// Approve Wali Invitation — only the other partner (not the creator)
// ============================================================
const approveWali = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnershipId } = req.body;

    if (!partnershipId) {
      return res.status(400).json({ error: "partnershipId is required" });
    }

    const partnership = await prisma.exclusivePartnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      return res.status(404).json({ error: "Exclusive partnership not found" });
    }

    if (partnership.userAId !== userId && partnership.userBId !== userId) {
      return res.status(403).json({ error: "You are not part of this exclusive partnership" });
    }

    const invitation = await prisma.waliInvitation.findUnique({
      where: { partnershipId },
      include: { wali: true },
    });

    if (!invitation) {
      return res.status(404).json({ error: "No Wali invitation found" });
    }

    if (invitation.status !== "pending_approval") {
      return res.status(400).json({ error: "This invitation is not pending approval" });
    }

    // The creator cannot approve their own request
    if (invitation.createdById === userId) {
      return res.status(403).json({ error: "You cannot approve your own Wali invitation request" });
    }

    // Generate the secure token now and send the email
    const rawToken = generateSecureToken();
    const secureTokenHash = hashToken(rawToken);

    await prisma.waliInvitation.update({
      where: { id: invitation.id },
      data: { status: "active", secureTokenHash },
    });

    // Send invitation email — failure here should not block the approval
    try {
      const waliLink = `${APP_URL}/wali/view/${rawToken}`;
      const html = emailTemplate(
        "Wali Invitation — Ethio Nikah",
        `<p>Assalamu Alaikum,</p>
         <p>You have been invited to observe the marriage conversation between two individuals on Ethio Nikah.</p>
         <p><strong>${invitation.wali.name}</strong> (${invitation.wali.relationship}) has been invited as a Wali (guardian) to oversee the conversation.</p>
         <p>Click the secure link below to view the conversation:</p>
         <p style="margin:24px 0;">
           <a href="${waliLink}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#0c0a1a;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;">View Conversation</a>
         </p>
         <p style="font-size:13px;color:#888;">This link will expire in ${EXPIRY_DAYS} days. If you did not expect this invitation, you can safely ignore this email.</p>`
      );

      await sendEmail({
        to: invitation.wali.email,
        subject: "Wali Invitation — View Marriage Conversation on Ethio Nikah",
        text: `You have been invited to observe a marriage conversation on Ethio Nikah. Click this secure link to view: ${waliLink}`,
        html,
      });
    } catch (emailErr) {
      console.error("Wali email send failed (approval still succeeded):", emailErr);
    }

    // Notify the creator that it was approved
    try {
      await createNotification({
        userId: invitation.createdById,
        type: "wali_invitation_approved",
        title: "Wali Invitation Approved",
        body: `Your partner has approved the Wali invitation for ${invitation.wali.name} (${invitation.wali.relationship}). The email has been sent.`,
      });
    } catch (notifErr) {
      console.error("Wali approval notification failed:", notifErr);
    }

    res.json({ message: "Wali invitation approved and email sent" });
  } catch (error) {
    console.error("Approve Wali error:", error?.message || error);
    res.status(500).json({ error: "Failed to approve Wali invitation: " + (error?.message || "Unknown error") });
  }
};

// ============================================================
// Decline Wali Invitation — only the other partner (not the creator)
// ============================================================
const declineWali = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnershipId } = req.body;

    if (!partnershipId) {
      return res.status(400).json({ error: "partnershipId is required" });
    }

    const partnership = await prisma.exclusivePartnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      return res.status(404).json({ error: "Exclusive partnership not found" });
    }

    if (partnership.userAId !== userId && partnership.userBId !== userId) {
      return res.status(403).json({ error: "You are not part of this exclusive partnership" });
    }

    const invitation = await prisma.waliInvitation.findUnique({
      where: { partnershipId },
      include: { wali: true },
    });

    if (!invitation) {
      return res.status(404).json({ error: "No Wali invitation found" });
    }

    if (invitation.status !== "pending_approval") {
      return res.status(400).json({ error: "This invitation is not pending approval" });
    }

    if (invitation.createdById === userId) {
      return res.status(403).json({ error: "You cannot decline your own Wali invitation request" });
    }

    await prisma.waliInvitation.update({
      where: { id: invitation.id },
      data: { status: "declined", revokedAt: new Date() },
    });

    // Notify the creator that it was declined
    await createNotification({
      userId: invitation.createdById,
      type: "wali_invitation_declined",
      title: "Wali Invitation Declined",
      body: `Your partner has declined the Wali invitation for ${invitation.wali.name} (${invitation.wali.relationship}).`,
    });

    res.json({ message: "Wali invitation declined" });
  } catch (error) {
    console.error("Decline Wali error:", error);
    res.status(500).json({ error: "Failed to decline Wali invitation" });
  }
};

// ============================================================
// Revoke Wali Access — either partner can revoke
// ============================================================
const revokeWali = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnershipId } = req.body;

    if (!partnershipId) {
      return res.status(400).json({ error: "partnershipId is required" });
    }

    const partnership = await prisma.exclusivePartnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      return res.status(404).json({ error: "Exclusive partnership not found" });
    }

    if (partnership.userAId !== userId && partnership.userBId !== userId) {
      return res.status(403).json({ error: "You are not part of this exclusive partnership" });
    }

    const result = await prisma.waliInvitation.updateMany({
      where: { partnershipId, status: { in: ["active", "pending_approval"] } },
      data: { status: "revoked", revokedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "No active Wali invitation found for this partnership" });
    }

    // Notify the other partner
    const otherUserId = partnership.userAId === userId ? partnership.userBId : partnership.userAId;
    await createNotification({
      userId: otherUserId,
      type: "wali_revoked",
      title: "Wali Access Revoked",
      body: "Wali access to your conversation has been revoked by your partner.",
    });

    res.json({ message: "Wali access revoked successfully" });
  } catch (error) {
    console.error("Revoke Wali error:", error);
    res.status(500).json({ error: "Failed to revoke Wali access" });
  }
};

// ============================================================
// Get Wali invitation status for a partnership
// ============================================================
const getWaliStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnershipId } = req.params;

    const partnership = await prisma.exclusivePartnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      return res.status(404).json({ error: "Exclusive partnership not found" });
    }

    if (partnership.userAId !== userId && partnership.userBId !== userId) {
      return res.status(403).json({ error: "You are not part of this exclusive partnership" });
    }

    const invitation = await prisma.waliInvitation.findUnique({
      where: { partnershipId },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
        lastAccessedAt: true,
        createdById: true,
        wali: { select: { id: true, name: true, relationship: true, email: true, phone: true } },
      },
    });

    res.json({ invitation });
  } catch (error) {
    console.error("Get Wali status error:", error);
    res.status(500).json({ error: "Failed to get Wali status" });
  }
};

// ============================================================
// Public: Verify Wali token and return conversation data
// No authentication required — token-based access
// ============================================================
const verifyWaliToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 32) {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    const secureTokenHash = hashToken(token);

    const invitation = await prisma.waliInvitation.findFirst({
      where: { secureTokenHash },
      include: {
        wali: { select: { name: true, relationship: true } },
        partnership: {
          include: {
            userA: {
              select: {
                id: true, firstName: true, lastName: true,
                profile: { select: { photos: true } },
              },
            },
            userB: {
              select: {
                id: true, firstName: true, lastName: true,
                profile: { select: { photos: true } },
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    // Check if revoked
    if (invitation.status === "revoked") {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return res.status(403).json({ error: "This invitation has expired." });
    }

    // Check if partnership is still active
    if (invitation.partnership.status !== "active") {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    // Update last accessed time
    await prisma.waliInvitation.update({
      where: { id: invitation.id },
      data: { lastAccessedAt: new Date() },
    });

    // Return partnership info (no sensitive data)
    res.json({
      waliName: invitation.wali.name,
      relationship: invitation.wali.relationship,
      partnership: {
        status: invitation.partnership.status,
        createdAt: invitation.partnership.createdAt,
      },
      userA: {
        id: invitation.partnership.userA.id,
        firstName: invitation.partnership.userA.firstName,
        lastName: invitation.partnership.userA.lastName,
        photo: invitation.partnership.userA.profile?.photos?.[0] || null,
      },
      userB: {
        id: invitation.partnership.userB.id,
        firstName: invitation.partnership.userB.firstName,
        lastName: invitation.partnership.userB.lastName,
        photo: invitation.partnership.userB.profile?.photos?.[0] || null,
      },
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Verify Wali token error:", error);
    res.status(500).json({ error: "Failed to verify invitation" });
  }
};

// ============================================================
// Public: Get conversation messages for Wali (read-only)
// No authentication — token-based access
// ============================================================
const getWaliMessages = async (req, res) => {
  try {
    const { token } = req.params;
    const { page = "1", limit = "50" } = req.query;

    if (!token || token.length < 32) {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    const secureTokenHash = hashToken(token);

    const invitation = await prisma.waliInvitation.findFirst({
      where: { secureTokenHash },
      include: { partnership: true },
    });

    if (!invitation) {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    if (invitation.status === "revoked") {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(403).json({ error: "This invitation has expired." });
    }

    if (invitation.partnership.status !== "active") {
      return res.status(403).json({ error: "This invitation is no longer valid." });
    }

    const userAId = invitation.partnership.userAId;
    const userBId = invitation.partnership.userBId;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const offset = (pageNum - 1) * limitNum;

    // Get messages between the two partners only
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userAId, receiverId: userBId },
          { senderId: userBId, receiverId: userAId },
        ],
        deletedForReceiver: false,
        deletedForSender: false,
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limitNum,
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
        isEdited: true,
      },
    });

    const total = await prisma.message.count({
      where: {
        OR: [
          { senderId: userAId, receiverId: userBId },
          { senderId: userBId, receiverId: userAId },
        ],
        deletedForReceiver: false,
        deletedForSender: false,
      },
    });

    res.json({
      messages: messages.reverse(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Wali messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

module.exports = {
  inviteWali,
  approveWali,
  declineWali,
  revokeWali,
  getWaliStatus,
  verifyWaliToken,
  getWaliMessages,
};
