const { verifyAccessToken } = require("../config/auth");
const prisma = require("../config/database");

// ============================================================
// Redis cache for auth checks — avoids a DB query on every
// single authenticated request. Short TTL (30s) ensures
// tokenVersion changes (session invalidation) propagate quickly.
// Falls back to DB query when Redis is unavailable.
// ============================================================
const AUTH_CACHE_TTL = 30; // seconds

async function getCachedAuthData(userId) {
  try {
    const { getGeneralClient } = require("../config/redis");
    const client = await getGeneralClient();
    if (client) {
      const cached = await client.get(`auth:${userId}`);
      if (cached) return JSON.parse(cached);
    }
  } catch {}
  return null;
}

async function setCachedAuthData(userId, data) {
  try {
    const { getGeneralClient } = require("../config/redis");
    const client = await getGeneralClient();
    if (client) {
      await client.set(`auth:${userId}`, JSON.stringify(data), { EX: AUTH_CACHE_TTL });
    }
  } catch {}
}

async function invalidateAuthCache(userId) {
  try {
    const { getGeneralClient } = require("../config/redis");
    const client = await getGeneralClient();
    if (client) {
      await client.del(`auth:${userId}`);
    }
  } catch {}
}

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = verifyAccessToken(token);
    if (req.user.tokenVersion === undefined) return next();

    const userId = req.user.userId;

    // Try Redis cache first — avoids DB query on most requests
    const cached = await getCachedAuthData(userId);
    if (cached) {
      if (cached.isDeleted || cached.deletedAt) {
        const canRestore = new Date() - new Date(cached.deletedAt) < 30 * 24 * 60 * 60 * 1000;
        return res.status(403).json({
          error: canRestore
            ? "Your account has been deleted. Contact support within 30 days if you wish to restore it."
            : "Your account has been permanently deleted and cannot be restored.",
          code: "ACCOUNT_DELETED",
          deletedAt: cached.deletedAt,
          canRestore,
        });
      }
      if (cached.tokenVersion !== req.user.tokenVersion) {
        return res.status(401).json({ error: "Session invalidated. Please login again." });
      }
      req.user.isActive = cached.isActive;
      req.user.role = cached.role;
      req.user.adminRole = cached.adminRole;
      return next();
    }

    // Cache miss — query DB and cache result
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true, isActive: true, deletedAt: true, isDeleted: true, role: true, adminRole: true },
    });

    if (!dbUser) return res.status(401).json({ error: "Account not found" });

    // Cache the result (even deleted accounts — short TTL ensures eventual consistency)
    await setCachedAuthData(userId, {
      tokenVersion: dbUser.tokenVersion,
      isActive: dbUser.isActive,
      deletedAt: dbUser.deletedAt,
      isDeleted: dbUser.isDeleted,
      role: dbUser.role,
      adminRole: dbUser.adminRole,
    });

    if (dbUser.isDeleted || dbUser.deletedAt) {
      const canRestore = new Date() - new Date(dbUser.deletedAt) < 30 * 24 * 60 * 60 * 1000;
      return res.status(403).json({
        error: canRestore
          ? "Your account has been deleted. Contact support within 30 days if you wish to restore it."
          : "Your account has been permanently deleted and cannot be restored.",
        code: "ACCOUNT_DELETED",
        deletedAt: dbUser.deletedAt,
        canRestore,
      });
    }
    if (dbUser.tokenVersion !== req.user.tokenVersion) return res.status(401).json({ error: "Session invalidated. Please login again." });
    req.user.isActive = dbUser.isActive;
    req.user.role = dbUser.role;
    req.user.adminRole = dbUser.adminRole;
    next();
  } catch (err) {
    if (err?.message === "jwt expired" || err?.message === "invalid token") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    console.error("Auth middleware error:", err?.message, err?.stack);
    return res.status(503).json({ error: "Authentication service temporarily unavailable. Please try again." });
  }
};

const requireActive = (req, res, next) => {
  if (req.user.isActive === false) {
    return res.status(403).json({ error: "Your account has been suspended" });
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

const requireAdmin2FA = (req, res, next) => {
  if (req.user.role !== "admin") return next();
  // Super admins are exempt from the 2FA requirement
  if (req.user.adminRole === "super_admin") return next();
  prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { twoFactorEnabled: true },
  }).then((dbUser) => {
    if (!dbUser?.twoFactorEnabled) {
      return res.status(403).json({
        error: "Two-factor authentication (2FA) is required for admin accounts to perform this action.",
        code: "ADMIN_2FA_REQUIRED",
      });
    }
    next();
  }).catch(() => {
    return res.status(503).json({ error: "Authentication service temporarily unavailable." });
  });
};

module.exports = { authenticate, authorize, requireActive, requireAdmin2FA, invalidateAuthCache };
