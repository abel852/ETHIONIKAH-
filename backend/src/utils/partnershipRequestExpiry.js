const cron = require("node-cron");
const prisma = require("../config/database");
const { createNotification } = require("./notification");

// ============================================================
// Exclusive Partnership Request Expiry Cron Job
// - Runs daily at 2:30 AM
// - Finds pending ExclusivePartnershipRequests older than 30 days
// - Updates their status to "expired"
// - Notifies the requester (A) that their request expired
// ============================================================

const EXPIRY_DAYS = 30;

async function expireOldPartnershipRequests() {
  const cutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    const expired = await prisma.exclusivePartnershipRequest.findMany({
      where: {
        status: "pending",
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        requesterId: true,
        receiverId: true,
        createdAt: true,
      },
    });

    if (expired.length === 0) {
      console.log("[PARTNERSHIP-EXPIRY] No pending requests to expire.");
      return;
    }

    // Update all expired requests
    const result = await prisma.exclusivePartnershipRequest.updateMany({
      where: {
        id: { in: expired.map((r) => r.id) },
        status: "pending",
      },
      data: { status: "expired", respondedAt: new Date() },
    });

    console.log("[PARTNERSHIP-EXPIRY] Expired " + result.count + " partnership request(s).");

    // Notify the requester (A) for each expired request
    for (const req of expired) {
      await createNotification({
        userId: req.requesterId,
        type: "exclusive_partnership_expired",
        title: "Partnership Request Expired",
        body: "Your exclusive partnership request has expired after 30 days without a response.",
      });
    }
  } catch (error) {
    console.error("[PARTNERSHIP-EXPIRY] Failed to expire requests:", error.message);
  }
}

function initPartnershipRequestExpiryCron() {
  // Run daily at 2:30 AM
  cron.schedule("30 2 * * *", async () => {
    console.log("[PARTNERSHIP-EXPIRY] Running daily partnership request expiry check...");
    await expireOldPartnershipRequests();
  });

  // Also run on startup after 90 second delay
  setTimeout(() => {
    expireOldPartnershipRequests();
  }, 90000);

  console.log("[PARTNERSHIP-EXPIRY] Partnership request expiry job scheduled (expiry: " + EXPIRY_DAYS + " days)");
}

module.exports = {
  initPartnershipRequestExpiryCron,
  expireOldPartnershipRequests,
};
