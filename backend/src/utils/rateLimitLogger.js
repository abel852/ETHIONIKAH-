const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "rate-limits.log");

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const repeatedOffenderCounts = new Map();
const ALERT_THRESHOLD = 10;

/**
 * Logs a rate limit hit to file and console.
 * Tracks repeated offenders and alerts when a single IP exceeds ALERT_THRESHOLD hits.
 *
 * @param {string} type - The rate limiter type (login, signup, message, etc.)
 * @param {object} req - Express request object
 */
function logRateLimitHit(type, req) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const userId = req.user?.userId || "anonymous";
  const route = req.originalUrl || req.url || "unknown";
  const method = req.method || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    type,
    ip,
    userId,
    method,
    route,
    userAgent,
  };

  const logLine = JSON.stringify(logEntry) + "\n";

  // Append to file
  try {
    fs.appendFileSync(LOG_FILE, logLine, { flag: "a" });
  } catch (err) {
    console.error("Failed to write rate limit log:", err.message);
  }

  // Console output for monitoring
  console.warn(`[RATE LIMIT] ${type.toUpperCase()} blocked: IP=${ip} User=${userId} Route=${method} ${route}`);

  // Track repeated offenders
  const count = (repeatedOffenderCounts.get(ip) || 0) + 1;
  repeatedOffenderCounts.set(ip, count);

  if (count === ALERT_THRESHOLD) {
    console.error(
      `[RATE LIMIT ALERT] IP ${ip} has hit rate limits ${count} times. ` +
      `Possible attack or bot detected. Consider blocking this IP temporarily.`
    );
  }

  // Alert again at higher thresholds
  if (count === 20 || count === 50 || count === 100) {
    console.error(
      `[RATE LIMIT CRITICAL] IP ${ip} has hit rate limits ${count} times. ` +
      `IMMEDIATE ACTION REQUIRED: Consider IP ban.`
    );
  }
}

/**
 * Returns a summary of repeated offenders for admin monitoring.
 */
function getOffenderStats() {
  const offenders = [];
  for (const [ip, count] of repeatedOffenderCounts.entries()) {
    if (count >= 3) {
      offenders.push({ ip, hits: count });
    }
  }
  return offenders.sort((a, b) => b.hits - a.hits);
}

/**
 * Clears the offender tracking data (e.g., on admin request).
 */
function clearOffenderStats() {
  repeatedOffenderCounts.clear();
}

module.exports = { logRateLimitHit, getOffenderStats, clearOffenderStats };
