const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function logAudit({ actorId, actorType = "ADMIN", action, resource, resourceId, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: { actorId, actorType, action, resource, resourceId, details: details || {}, ipAddress },
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}

module.exports = { logAudit };
