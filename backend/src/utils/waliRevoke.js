const prisma = require("../config/database");
const { logAudit } = require("./auditLogger");
const { createNotification } = require("./notification");

async function autoRevokeWaliInvitation(partnershipId, reason, actorId) {
  try {
    const invitation = await prisma.waliInvitation.findUnique({
      where: { partnershipId },
      include: { wali: true, partnership: true },
    });

    if (!invitation) return;

    if (invitation.status === "active" || invitation.status === "pending_approval") {
      await prisma.waliInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "revoked",
          secureTokenHash: null,
          revokedAt: new Date(),
        },
      });

      await logAudit({
        actorId: actorId || invitation.createdById,
        actorType: "SYSTEM",
        action: "wali_invitation_auto_revoked",
        resource: "wali_invitation",
        resourceId: invitation.id,
        details: { partnershipId, reason, waliName: invitation.wali.name },
      });

      const reasonMessages = {
        partnership_ended: "Wali access has been revoked because the exclusive partnership has ended.",
        user_soft_deleted: "Wali access has been revoked because the account is no longer available.",
        user_banned: "Wali access has been revoked because the account has been suspended.",
      };
      const msg = reasonMessages[reason] || "Wali access has been revoked.";

      const userAId = invitation.partnership.userAId;
      const userBId = invitation.partnership.userBId;

      await Promise.all([
        createNotification({ userId: userAId, type: "wali_revoked", title: "Wali Access Revoked", body: msg }).catch(() => {}),
        createNotification({ userId: userBId, type: "wali_revoked", title: "Wali Access Revoked", body: msg }).catch(() => {}),
      ]);
    }
  } catch (error) {
    console.error("Auto-revoke Wali invitation error:", error.message);
  }
}

module.exports = { autoRevokeWaliInvitation };
