const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function logAudit({ adminId, action, resource, resourceId, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: { adminId, action, resource, resourceId, details: details || {}, ipAddress },
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}

module.exports = { logAudit };
