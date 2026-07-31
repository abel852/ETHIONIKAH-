const cron = require("node-cron");
const prisma = require("../config/database");
const { createNotification } = require("./notification");

// ============================================================
// Conversation Request Expiry Cron Job
// - Runs daily at 2 AM
// - Finds pending ConversationRequests older than
//   CONVERSATION_REQUEST_EXPIRY_DAYS (default 7)
// - Updates their status to "expired"
// - Notifies both requester and receiver
// ============================================================

const EXPIRY_DAYS = parseInt(process.env.CONVERSATION_REQUEST_EXPIRY_DAYS || "7", 10);

async function expireOldRequests() {
  const cutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    const expired = await prisma.conversationRequest.findMany({
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
      console.log("[CONV-EXPIRY] No pending requests to expire.");
      return;
    }

    // Update all expired requests
    const result = await prisma.conversationRequest.updateMany({
      where: {
        id: { in: expired.map((r) => r.id) },
        status: "pending",
      },
      data: { status: "expired", respondedAt: new Date() },
    });

    console.log(`[CONV-EXPIRY] Expired ${result.count} conversation request(s).`);

    // Notify both users for each expired request
    for (const req of expired) {
      await createNotification({
        userId: req.requesterId,
        type: "conversation_request_expired",
        title: "Conversation Request Expired",
        body: "Your conversation request has expired after 7 days without a response. You may send a new request if you wish.",
      });

      await createNotification({
        userId: req.receiverId,
        type: "conversation_request_expired",
        title: "Conversation Request Expired",
        body: "A conversation request sent to you has expired after 7 days without a response.",
      });
    }
  } catch (error) {
    console.error("[CONV-EXPIRY] Failed to expire requests:", error.message);
  }
}

function initConversationRequestExpiryCron() {
  // Run daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("[CONV-EXPIRY] Running daily conversation request expiry check...");
    await expireOldRequests();
  });

  // Also run on startup after 60 second delay
  setTimeout(() => {
    expireOldRequests();
  }, 60000);

  console.log(`[CONV-EXPIRY] Conversation request expiry job scheduled (expiry: ${EXPIRY_DAYS} days)`);
}

module.exports = {
  initConversationRequestExpiryCron,
  expireOldRequests,
};
