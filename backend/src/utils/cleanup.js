const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function deleteFile(filePath) {
  if (!filePath) return;
  const relative = filePath.replace(/^\//, "");
  const absolute = path.join(__dirname, "..", relative);
  fs.unlink(absolute, (err) => {
    if (err && err.code !== "ENOENT") console.error("Failed to delete file:", absolute, err.message);
  });
}

async function cleanupOldVerificationImages() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 15);

    const oldApproved = await prisma.verification.findMany({
      where: {
        status: "approved",
        reviewedAt: { lte: cutoff },
        OR: [
          { idDocumentPath: { not: null } },
          { selfiePath: { not: null } },
        ],
      },
      select: { id: true, idDocumentPath: true, selfiePath: true },
    });

    for (const v of oldApproved) {
      deleteFile(v.idDocumentPath);
      deleteFile(v.selfiePath);
    }

    if (oldApproved.length > 0) {
      const ids = oldApproved.map((v) => v.id);
      await prisma.verification.updateMany({
        where: { id: { in: ids } },
        data: { idDocumentPath: null, selfiePath: null },
      });
      console.log(`[Cleanup] Removed images for ${oldApproved.length} approved verification(s) older than 15 days`);
    }
  } catch (error) {
    console.error("[Cleanup] Error removing old verification images:", error);
  }
}

async function expireBans() {
  try {
    const now = new Date();
    const expiredRestrictions = await prisma.userRestriction.findMany({
      where: {
        type: "ban",
        expiresAt: { lte: now, not: null },
      },
      select: { userId: true, id: true },
    });

    if (expiredRestrictions.length === 0) return;

    const userIds = [...new Set(expiredRestrictions.map((r) => r.userId))];
    const restrictionIds = expiredRestrictions.map((r) => r.id);

    await prisma.$transaction([
      prisma.userRestriction.deleteMany({ where: { id: { in: restrictionIds } } }),
      ...userIds.map((uid) =>
        prisma.user.update({ where: { id: uid }, data: { isActive: true } })
      ),
    ]);

    console.log(`[Cleanup] Auto-unbanned ${userIds.length} user(s) — ban duration expired`);
  } catch (error) {
    console.error("[Cleanup] Error expiring bans:", error);
  }
}

async function cleanupOldReceipts() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 15);

    const oldPayments = await prisma.payment.findMany({
      where: { receiptUrl: { not: null }, createdAt: { lte: cutoff } },
      select: { id: true, receiptUrl: true },
    });

    for (const p of oldPayments) {
      deleteFile(p.receiptUrl);
    }

    if (oldPayments.length > 0) {
      const ids = oldPayments.map((p) => p.id);
      await prisma.payment.updateMany({
        where: { id: { in: ids } },
        data: { receiptUrl: null },
      });
      console.log(`[Cleanup] Removed receipt files for ${oldPayments.length} payment(s) older than 15 days`);
    }
  } catch (error) {
    console.error("[Cleanup] Error removing old receipts:", error);
  }
}

async function expireSubscriptions() {
  try {
    const now = new Date();
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: { status: "active", endDate: { lt: now } },
      include: { user: { select: { id: true, firstName: true, email: true } } },
    });

    if (expiredSubscriptions.length === 0) return;

    const { createNotification } = require("./notification");
    const ids = expiredSubscriptions.map((s) => s.id);

    await prisma.subscription.updateMany({
      where: { id: { in: ids } },
      data: { status: "expired" },
    });

    for (const s of expiredSubscriptions) {
      const planName = s.planType.charAt(0).toUpperCase() + s.planType.slice(1);
      createNotification({
        userId: s.userId,
        type: "payment",
        title: "Membership Expired",
        body: `Your ${planName} membership has expired. Renew now to keep your premium badge and benefits.`,
      }).catch((e) => console.error("Expiry notification error:", e));
    }

    console.log(`[Cleanup] Expired ${expiredSubscriptions.length} subscription(s) and sent renewal notifications`);
  } catch (error) {
    console.error("[Cleanup] Error expiring subscriptions:", error);
  }
}

// === Send 2FA reminder notifications to users who haven't enabled it ===
async function send2FAReminders() {
  try {
    const { createNotification } = require("./notification");

    // Find users without 2FA, excluding admins and deleted accounts
    const usersWithout2FA = await prisma.user.findMany({
      where: {
        twoFactorEnabled: false,
        deletedAt: null,
        adminRole: null,
        role: { not: "admin" },
        isActive: true,
        isEmailVerified: true,
      },
      select: { id: true, firstName: true },
    });

    if (usersWithout2FA.length === 0) return;

    // Check which users already received a 2FA reminder in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReminders = await prisma.notification.findMany({
      where: {
        type: "security_2fa_reminder",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { userId: true },
    });

    const recentlyNotified = new Set(recentReminders.map((r) => r.userId));
    const toNotify = usersWithout2FA.filter((u) => !recentlyNotified.has(u.id));

    if (toNotify.length === 0) {
      console.log("[2FA-Reminder] All eligible users already reminded recently");
      return;
    }

    let sent = 0;
    for (const user of toNotify) {
      await createNotification({
        userId: user.id,
        type: "security_2fa_reminder",
        title: "Secure Your Account",
        body: `Hi ${user.firstName}, protect your account with two-step authentication. Even if someone learns your password, they won't be able to log in without your authenticator code. Enable it now in Settings → Security.`,
      }).catch((e) => console.error(`[2FA-Reminder] Failed for ${user.id}:`, e.message));
      sent++;
    }

    console.log(`[2FA-Reminder] Sent ${sent} reminder notification(s) to users without 2FA`);
  } catch (error) {
    console.error("[2FA-Reminder] Error sending reminders:", error);
  }
}

// Run daily at 3:00 AM
cron.schedule("0 3 * * *", () => {
  cleanupOldVerificationImages();
  cleanupOldReceipts();
  expireSubscriptions();
  send2FAReminders();
});

// Run every hour to catch expiring subscriptions more quickly
cron.schedule("0 * * * *", () => {
  expireSubscriptions();
});

// Run every 5 minutes to check for expired bans
cron.schedule("*/5 * * * *", () => {
  expireBans();
});

// Run once on startup
cleanupOldVerificationImages();
cleanupOldReceipts();
expireSubscriptions();
expireBans();

module.exports = { cleanupOldVerificationImages, cleanupOldReceipts, expireSubscriptions, expireBans, send2FAReminders };
