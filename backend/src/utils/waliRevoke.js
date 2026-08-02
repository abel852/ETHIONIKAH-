const prisma = require("../config/database");
const { logAudit } = require("./auditLogger");

async function autoRevokeWaliInvitation(partnershipId, reason, adminId) {
  try {
    const invitation = await prisma.waliInvitation.findUnique({
      where: { partnershipId },
      include: { wali: true },
    });

    if (!invitation) return;

    if (invitation.status === "active" || invitation.status === "pending_approval") {
      await prisma.waliInvitation.update({
        where: { id: invitation.id },
        data: { status: "revoked", revokedAt: new Date() },
      });

      await logAudit({
        adminId: adminId || invitation.createdById,
        action: "wali_invitation_auto_revoked",
        resource: "wali_invitation",
        resourceId: invitation.id,
        details: { partnershipId, reason, waliName: invitation.wali.name },
      });
    }
  } catch (error) {
    console.error("Auto-revoke Wali invitation error:", error.message);
  }
}

module.exports = { autoRevokeWaliInvitation };
