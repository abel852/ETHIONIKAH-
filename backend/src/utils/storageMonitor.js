const cron = require("node-cron");
const { getStorageUsage, deleteOldFiles, isR2Enabled } = require("../config/r2");
const { createNotification } = require("./notification");
const prisma = require("../config/database");

// ============================================================
// R2 Storage Monitor & Retention Cron Jobs
// - Monitors storage usage and alerts admins at 80% and 90%
// - Deletes old verification images after retention period
// - Runs daily at 3 AM
// ============================================================

const VERIFICATION_RETENTION_DAYS = parseInt(process.env.R2_VERIFICATION_RETENTION_DAYS || "90", 10);
const ALERT_THRESHOLD_80 = 80;
const ALERT_THRESHOLD_90 = 90;

async function checkStorageUsage() {
  if (!isR2Enabled()) return;

  try {
    const usage = await getStorageUsage();
    if (!usage) return;

    console.log(`[R2-MONITOR] Storage: ${usage.totalSizeGB} GB / ${usage.planLimitGB} GB (${usage.usagePercent}%) — ${usage.fileCount} files`);

    // Alert at 80%
    if (usage.alert80 && !usage.alert90) {
      console.warn(`[R2-MONITOR] ⚠️ Storage at ${usage.usagePercent}% — approaching limit`);
      await notifyAdminsStorageAlert(usage, "80%");
    }

    // Alert at 90%
    if (usage.alert90) {
      console.error(`[R2-MONITOR] 🔴 Storage at ${usage.usagePercent}% — critical level`);
      await notifyAdminsStorageAlert(usage, "90%");
    }
  } catch (error) {
    console.error("[R2-MONITOR] Failed to check storage:", error.message);
  }
}

async function notifyAdminsStorageAlert(usage, level) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin", isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "system",
        title: `Storage Alert: ${level} Full`,
        body: `R2 storage is at ${usage.usagePercent}% (${usage.totalSizeGB} GB of ${usage.planLimitGB} GB used). ${level === "90%" ? "Immediate action required." : "Please review and clean up old files."}`,
      });
    }
  } catch (error) {
    console.error("[R2-MONITOR] Failed to send alerts:", error.message);
  }
}

async function runRetentionCleanup() {
  if (!isR2Enabled()) return;

  console.log(`[R2-RETENTION] Starting cleanup — retention: ${VERIFICATION_RETENTION_DAYS} days`);

  try {
    // Delete old verification images (national-ids and selfies)
    // Only deletes from R2 — database records are preserved for audit
    const idResult = await deleteOldFiles("national-ids/", VERIFICATION_RETENTION_DAYS);
    const selfieResult = await deleteOldFiles("selfies/", VERIFICATION_RETENTION_DAYS);

    // Delete old chat images (more aggressive — 60 days)
    const chatRetentionDays = parseInt(process.env.R2_CHAT_RETENTION_DAYS || "60", 10);
    const chatImgResult = await deleteOldFiles("chat-images/", chatRetentionDays);
    const chatFileResult = await deleteOldFiles("chat-files/", chatRetentionDays);

    console.log(`[R2-RETENTION] Cleanup complete:
  - national-ids: ${idResult.deleted} deleted (${idResult.errors} errors)
  - selfies: ${selfieResult.deleted} deleted (${selfieResult.errors} errors)
  - chat-images: ${chatImgResult.deleted} deleted (${chatImgResult.errors} errors)
  - chat-files: ${chatFileResult.deleted} deleted (${chatFileResult.errors} errors)
`);
  } catch (error) {
    console.error("[R2-RETENTION] Cleanup failed:", error.message);
  }
}

// Initialize cron jobs
function initStorageCron() {
  if (!isR2Enabled()) {
    console.log("[R2-CRON] R2 not configured — storage monitoring disabled");
    return;
  }

  // Check storage usage daily at 3 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("[R2-CRON] Running daily storage check...");
    await checkStorageUsage();
  });

  // Run retention cleanup weekly on Sundays at 4 AM
  cron.schedule("0 4 * * 0", async () => {
    console.log("[R2-CRON] Running weekly retention cleanup...");
    await runRetentionCleanup();
  });

  // Also check storage on startup (after 30 second delay)
  setTimeout(() => {
    checkStorageUsage();
  }, 30000);

  console.log("[R2-CRON] Storage monitoring and retention jobs scheduled");
}

module.exports = {
  initStorageCron,
  checkStorageUsage,
  runRetentionCleanup,
};
