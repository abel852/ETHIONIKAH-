const rateLimit = require("express-rate-limit");
const { logRateLimitHit } = require("../utils/rateLimitLogger");

// ============================================================
// Environment-aware configuration
// Development: relaxed limits for testing
// Production: strict limits for security
// ============================================================
const isDev = process.env.NODE_ENV !== "production"; // default to dev limits unless explicitly production

// ============================================================
// Redis-backed rate limit store — shares counters across all
// Node.js processes (PM2 cluster mode). Falls back to the
// default in-memory store when REDIS_URL is not set or Redis
// is unavailable.
// ============================================================
let redisStore = null;
let redisStoreInitAttempted = false;

async function getRedisStore() {
  if (redisStore) return redisStore;
  if (redisStoreInitAttempted) return null; // already failed, don't retry
  redisStoreInitAttempted = true;

  if (!process.env.REDIS_URL) return null;
  if (process.env.REDIS_URL.includes("YOUR_")) return null;

  try {
    const { getGeneralClient } = require("../config/redis");
    const client = await getGeneralClient();
    if (!client) return null;
    const RedisStore = require("rate-limit-redis");
    redisStore = new RedisStore({
      sendCommand: (...args) => client.sendCommand(args),
    });
    console.log("[RATE-LIMIT] Redis store initialized — multi-process rate limiting active");
    return redisStore;
  } catch (err) {
    console.warn(`[RATE-LIMIT] Redis store init failed, using in-memory: ${err.message}`);
    return null;
  }
}

// ============================================================
// Factory: create a rate limiter that uses Redis store when
// available, falling back to in-memory otherwise.
// ============================================================
function createLimiter(options) {
  const limiter = rateLimit({
    ...options,
    // store will be set asynchronously below if Redis is available
  });

  // Attempt to attach Redis store
  getRedisStore().then((store) => {
    if (store) limiter.store = store;
  }).catch(() => {});

  return limiter;
}

// ============================================================
// Production-configurable defaults (2 vCPU / 4 GB VPS)
// All values overridable via .env — safe fallbacks if absent
// ============================================================
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 min
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || process.env.RATE_LIMIT_MAX || (isDev ? "20000" : "2000"), 10);
const MESSAGE_LIMIT_WINDOW = parseInt(process.env.MESSAGE_LIMIT_WINDOW || "10000", 10); // 10 sec
const MESSAGE_LIMIT_MAX = parseInt(process.env.MESSAGE_LIMIT_MAX || (isDev ? "1000" : "200"), 10);
const UPLOAD_LIMIT_WINDOW = parseInt(process.env.UPLOAD_LIMIT_WINDOW || "60000", 10); // 1 min
const UPLOAD_LIMIT_MAX = parseInt(process.env.UPLOAD_LIMIT_MAX || (isDev ? "200" : "40"), 10);

// Login limiter settings — configurable via env
const LOGIN_LIMIT_WINDOW = parseInt(process.env.LOGIN_LIMIT_WINDOW || (isDev ? "60000" : "30000"), 10); // dev: 60s, prod: 30s
const LOGIN_LIMIT_MAX = parseInt(process.env.LOGIN_LIMIT_MAX || (isDev ? "200" : "40"), 10); // dev: 200, prod: 40
const LOGIN_BAN_DURATION = parseInt(process.env.LOGIN_BAN_DURATION || (isDev ? "30000" : "7200000"), 10); // dev: 30s, prod: 2h

console.log(`[RATE-LIMIT] Mode: ${isDev ? "DEVELOPMENT" : "PRODUCTION"} | API: ${RATE_LIMIT_MAX_REQUESTS}/${RATE_LIMIT_WINDOW_MS}ms | Login: ${LOGIN_LIMIT_MAX}/${LOGIN_LIMIT_WINDOW}ms (ban: ${LOGIN_BAN_DURATION}ms)`);

// ============================================================
// 1. GENERAL API LIMITER — configurable requests / window per IP
// ============================================================
const apiLimiter = createLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("general", req);
    res.status(429).json({
      error: "Too many requests. Please try again later.",
      retryAfter: res.getHeader("Retry-After") || Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    });
  },
});

// ============================================================
// 2. LOGIN LIMITER — env-configurable attempts / window per IP
//    Blocks rapid-fire login attempts and automated attacks
//    Blocked IPs receive a 429 response with retryAfter info
// ============================================================

// Track banned IPs with expiry (in-memory fallback, Redis if available)
const bannedIPs = new Map(); // ip → expiry timestamp

function isIPBanned(ip) {
  const expiry = bannedIPs.get(ip);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    bannedIPs.delete(ip);
    return false;
  }
  return true;
}

function banIP(ip, durationMs) {
  bannedIPs.set(ip, Date.now() + durationMs);
}

// Pre-middleware: reject banned IPs with a clear 429 response
const loginBanCheck = (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (isIPBanned(ip)) {
    const expiry = bannedIPs.get(ip);
    const retryAfter = Math.ceil((expiry - Date.now()) / 1000);
    logRateLimitHit("loginBanned", req);
    return res.status(429).json({
      error: "Too many login attempts. Please try again later.",
      retryAfter,
    });
  }
  next();
};

const loginLimiter = createLimiter({
  windowMs: LOGIN_LIMIT_WINDOW,
  max: LOGIN_LIMIT_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    banIP(ip, LOGIN_BAN_DURATION);
    logRateLimitHit("login", req);
    res.status(429).json({
      error: "Too many login attempts. Please try again later.",
      retryAfter: Math.ceil(LOGIN_BAN_DURATION / 1000),
    });
  },
});

// Middleware pass-through (no longer exposes rate limit info to client)
const loginRateInfo = (req, res, next) => {
  next();
};

// ============================================================
// 3. SIGNUP LIMITER — 1 registration / 1 hour per IP
//    Prevents mass account creation / bot signups
// ============================================================
const signupLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 1,
  message: { error: "Too many registration attempts. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("signup", req);
    res.status(429).json({
      error: "Too many registration attempts. Please try again in 1 hour.",
      retryAfter: res.getHeader("Retry-After") || 3600,
    });
  },
});

// ============================================================
// 4. PASSWORD RESET LIMITER — 4 attempts / 15 min per IP
//    Prevents email enumeration via forgot-password
// ============================================================
const passwordResetLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 4,
  message: { error: "Too many password reset requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("passwordReset", req);
    res.status(429).json({
      error: "Too many password reset requests. Please try again later.",
      retryAfter: res.getHeader("Retry-After") || 900,
    });
  },
});

// ============================================================
// 5. MESSAGE LIMITER — env-configurable messages / window per user
//    Stops spam in chat
// ============================================================
const messageLimiter = createLimiter({
  windowMs: MESSAGE_LIMIT_WINDOW,
  max: MESSAGE_LIMIT_MAX,
  keyGenerator: (req) => req.user?.userId || req.ip,
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("message", req);
    res.socket?.destroy();
  },
});

// ============================================================
// 6. MESSAGE IMAGE/FILE UPLOAD LIMITER — env-configurable uploads / window per user
//    Prevents media spam
// ============================================================
const messageUploadLimiter = createLimiter({
  windowMs: UPLOAD_LIMIT_WINDOW,
  max: UPLOAD_LIMIT_MAX,
  keyGenerator: (req) => req.user?.userId || req.ip,
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("messageUpload", req);
    res.status(429).json({ error: "Upload limit reached. Please try again later." });
  },
});

// ============================================================
// 7. PROFILE UPDATE LIMITER — 3 updates / 15 min per user
//    Prevents profile abuse / automated scraping
// ============================================================
const profileUpdateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Too many profile updates. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("profileUpdate", req);
    res.status(429).json({
      error: "Too many profile updates. Please try again later.",
      retryAfter: res.getHeader("Retry-After") || 900,
    });
  },
});

// ============================================================
// 8. PHOTO UPLOAD LIMITER — 2 uploads / 30 min per user
// ============================================================
const photoUploadLimiter = createLimiter({
  windowMs: 30 * 60 * 1000,
  max: 2,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Too many photo uploads. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("photoUpload", req);
    res.status(429).json({
      error: "Too many photo uploads. Please try again later.",
      retryAfter: res.getHeader("Retry-After") || 900,
    });
  },
});

// ============================================================
// 9. PROFILE VIEW LIMITER — 30 views / 15 min per user
//    Prevents profile enumeration / scraping via /:id and /user/:userId
// ============================================================
const profileViewLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Too many profile views. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("profileView", req);
    res.status(429).json({
      error: "Too many profile views. Please slow down.",
      retryAfter: res.getHeader("Retry-After") || 60,
    });
  },
});

// ============================================================
// 10. MATCH ACTION LIMITER — 10 actions / min per user
//    Likes/dislikes/super-likes
// ============================================================
const matchActionLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Too many actions. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("matchAction", req);
    res.status(429).json({
      error: "Too many actions. Please slow down.",
      retryAfter: res.getHeader("Retry-After") || 60,
    });
  },
});

// ============================================================
// 10. THROTTLE MIDDLEWARE — gradual delay after N requests
//     Slows down bots without blocking normal users
//     After `threshold` requests in the window, adds delay per extra request
//     Uses Redis INCR with TTL when available for multi-process accuracy
// ============================================================
const THROTTLE_REDIS_PREFIX = "throttle:";

const throttle = (threshold = 10, windowMs = 60 * 1000) => {
  // In-memory fallback store
  const memStore = new Map();
  const MAX_STORE_SIZE = 10000;

  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of memStore.entries()) {
      if (now - entry.startTime > windowMs) memStore.delete(key);
    }
  };
  const interval = setInterval(cleanup, windowMs);
  interval.unref();

  return async (req, res, next) => {
    const key = req.user?.userId || req.ip;
    const now = Date.now();
    const ttlSeconds = Math.ceil(windowMs / 1000);

    // Try Redis first
    try {
      const { getGeneralClient } = require("../config/redis");
      const client = await getGeneralClient();
      if (client) {
        const redisKey = THROTTLE_REDIS_PREFIX + key;
        const count = await client.incr(redisKey);
        if (count === 1) {
          await client.expire(redisKey, ttlSeconds);
        }
        if (count > threshold) {
          const delayMs = Math.min((count - threshold) * 500, 10000);
          return setTimeout(next, delayMs);
        }
        return next();
      }
    } catch {
      // Fall back to in-memory
    }

    // In-memory path
    let entry = memStore.get(key);

    if (!entry || now - entry.startTime > windowMs) {
      if (memStore.size >= MAX_STORE_SIZE) {
        const oldestKey = memStore.keys().next().value;
        if (oldestKey) memStore.delete(oldestKey);
      }
      entry = { count: 0, startTime: now };
      memStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > threshold) {
      const delayMs = Math.min((entry.count - threshold) * 500, 10000);
      return setTimeout(next, delayMs);
    }

    next();
  };
};

// Legacy alias for backward compatibility
const authLimiter = loginLimiter;

// ============================================================
// 5. CONTACT SUPPORT LIMITER — 3 attempts / hour per IP
// ============================================================
const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many contact requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit("contactSupport", req);
    res.status(429).json({
      error: "Too many contact requests. Please try again in 1 hour.",
      retryAfter: res.getHeader("Retry-After") || 3600,
    });
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  loginBanCheck,
  loginRateInfo,
  signupLimiter,
  passwordResetLimiter,
  messageLimiter,
  messageUploadLimiter,
  profileUpdateLimiter,
  photoUploadLimiter,
  profileViewLimiter,
  matchActionLimiter,
  throttle,
  authLimiter,
  contactLimiter,
};

