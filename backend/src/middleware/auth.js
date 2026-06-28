const { verifyAccessToken } = require("../config/auth");
const prisma = require("../config/database");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = verifyAccessToken(token);
    if (req.user.tokenVersion === undefined) return next();
    prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { tokenVersion: true, isActive: true },
    }).then((dbUser) => {
      if (!dbUser || !dbUser.isActive) return res.status(401).json({ error: "Account not found or inactive" });
      if (dbUser.tokenVersion !== req.user.tokenVersion) return res.status(401).json({ error: "Session invalidated. Please login again." });
      next();
    }).catch(() => res.status(500).json({ error: "Auth check failed" }));
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

module.exports = { authenticate, authorize };
