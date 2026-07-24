const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "uploads.log");

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const suspiciousIPs = new Map();

/**
 * Logs every file upload attempt — successful and blocked.
 * Tracks suspicious patterns (repeated blocked attempts from same IP).
 */
function logUpload(req, file, status, reason) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const userId = req.user?.userId || "anonymous";
  const fieldName = file?.fieldname || "unknown";
  const originalName = file?.originalname || "unknown";
  const mimeType = file?.mimetype || "unknown";
  const fileSize = file?.size || 0;
  const timestamp = new Date().toISOString();

  const entry = {
    timestamp,
    status, // "uploaded" | "blocked" | "rejected"
    reason: reason || null,
    ip,
    userId,
    fieldName,
    originalName,
    mimeType,
    fileSize,
  };

  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", { flag: "a" });
  } catch (err) {
    console.error("Failed to write upload log:", err.message);
  }

  if (status === "blocked" || status === "rejected") {
    console.warn(`[UPLOAD BLOCKED] IP=${ip} User=${userId} File=${originalName} Type=${mimeType} Reason=${reason}`);

    const count = (suspiciousIPs.get(ip) || 0) + 1;
    suspiciousIPs.set(ip, count);

    if (count >= 5) {
      console.error(`[UPLOAD ALERT] IP ${ip} has ${count} blocked upload attempts. Possible malicious activity.`);
    }
  } else {
    console.log(`[UPLOAD OK] User=${userId} File=${originalName} Size=${(fileSize / 1024).toFixed(1)}KB Type=${mimeType}`);
  }
}

/**
 * Returns suspicious upload stats for admin monitoring.
 */
function getUploadStats() {
  const suspicious = [];
  for (const [ip, count] of suspiciousIPs.entries()) {
    if (count >= 2) suspicious.push({ ip, blockedAttempts: count });
  }
  return suspicious.sort((a, b) => b.blockedAttempts - a.blockedAttempts);
}

/**
 * Clears suspicious IP tracking data.
 */
function clearUploadStats() {
  suspiciousIPs.clear();
}

module.exports = { logUpload, getUploadStats, clearUploadStats };
