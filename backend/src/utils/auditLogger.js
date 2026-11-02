const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function logAudit({ actorId, adminId, userId, actorType = "ADMIN", action, resource, resourceId, details, ipAddress }) {
  const resolvedActorId = actorId || adminId || userId;
  if (!resolvedActorId) {
    return;
  }
  try {
    await prisma.auditLog.create({
      data: { actorId: resolvedActorId, actorType, action, resource, resourceId, details: details || {}, ipAddress },
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}

module.exports = { logAudit };
