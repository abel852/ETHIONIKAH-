/**
 * Concurrency Limiter — graceful overload protection for production
 *
 * Tracks active in-flight requests per route group.
 * When the number of concurrent requests exceeds the configured max,
 * new requests receive a 503 "Server busy" response with a retryAfter hint.
 *
 * All limits are configurable via environment variables:
 *   MAX_CONCURRENT_MESSAGES  (default 100)  — simultaneous text messages
 *   MAX_CONCURRENT_UPLOADS   (default 25)   — simultaneous image/file uploads
 *   MAX_CONCURRENT_API       (default 200)  — global API concurrency cap
 *   MAX_CONCURRENT_PER_USER  (default 10)   — per-user concurrent requests
 *
 * First-come-first-served: requests that arrive when capacity is full are
 * politely rejected with a retry-after suggestion instead of crashing.
 */

const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || "100", 10);
const MAX_CONCURRENT_UPLOADS = parseInt(process.env.MAX_CONCURRENT_UPLOADS || "25", 10);
const MAX_CONCURRENT_API = parseInt(process.env.MAX_CONCURRENT_API || "200", 10);
const MAX_CONCURRENT_PER_USER = parseInt(process.env.MAX_CONCURRENT_PER_USER || "10", 10);

// In-flight counters per category
const counters = {
  messages: { active: 0, max: MAX_CONCURRENT_MESSAGES },
  uploads: { active: 0, max: MAX_CONCURRENT_UPLOADS },
  api: { active: 0, max: MAX_CONCURRENT_API },
};

// Per-user in-flight tracking
const perUserActive = new Map();
const PER_USER_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 min

// Periodically clean up stale per-user entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of perUserActive.entries()) {
    if (now - entry.lastSeen > PER_USER_CLEANUP_INTERVAL && entry.active === 0) {
      perUserActive.delete(key);
    }
  }
}, PER_USER_CLEANUP_INTERVAL);

/**
 * Creates a concurrency limiter middleware for the given category.
 * @param {"messages"|"uploads"|"api"} category
 * @param {number} retryAfterSeconds - seconds to tell the client to wait before retrying
 */
function createConcurrencyLimiter(category, retryAfterSeconds = 3) {
  const bucket = counters[category];

  return (req, res, next) => {
    // Check global category capacity
    if (bucket.active >= bucket.max) {
      console.warn(
        `[CONCURRENCY] ${category} at capacity (${bucket.active}/${bucket.max}) — ` +
        `rejecting request from user ${req.user?.userId || "anonymous"}`
      );
      return res.status(503).json({
        error: "Server is busy. Please try again in a few seconds.",
        code: "SERVER_BUSY",
        retryAfter: retryAfterSeconds,
      });
    }

    // Check per-user concurrency
    const userId = req.user?.userId || req.ip;
    let userEntry = perUserActive.get(userId);
    if (!userEntry) {
      userEntry = { active: 0, lastSeen: Date.now() };
      perUserActive.set(userId, userEntry);
    }

    if (userEntry.active >= MAX_CONCURRENT_PER_USER) {
      console.warn(
        `[CONCURRENCY] Per-user limit reached for ${userId} (${userEntry.active}/${MAX_CONCURRENT_PER_USER}) — ` +
        `rejecting ${category} request`
      );
      return res.status(503).json({
        error: "You have too many active requests. Please wait for some to complete.",
        code: "USER_BUSY",
        retryAfter: retryAfterSeconds,
      });
    }

    // Acquire slots
    bucket.active++;
    userEntry.active++;
    userEntry.lastSeen = Date.now();

    // Release exactly once — guard against double-release from both finish+close
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      if (bucket.active > 0) bucket.active--;
      const ue = perUserActive.get(userId);
      if (ue && ue.active > 0) ue.active--;
    };

    res.on("finish", release);
    res.on("close", release);

    next();
  };
}

/**
 * Returns current concurrency stats — useful for admin monitoring.
 */
function getConcurrencyStats() {
  return {
    messages: { active: counters.messages.active, max: counters.messages.max },
    uploads: { active: counters.uploads.active, max: counters.uploads.max },
    api: { active: counters.api.active, max: counters.api.max },
    perUserLimit: MAX_CONCURRENT_PER_USER,
    trackedUsers: perUserActive.size,
  };
}

module.exports = {
  createConcurrencyLimiter,
  getConcurrencyStats,
  messageConcurrencyLimiter: createConcurrencyLimiter("messages"),
  uploadConcurrencyLimiter: createConcurrencyLimiter("uploads"),
  apiConcurrencyLimiter: createConcurrencyLimiter("api"),
};
