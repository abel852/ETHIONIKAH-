const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const multer = require("multer");
require("dotenv").config();
const { createServer } = require("http");
const { Server: SocketServer } = require("socket.io");

const app = express();
const httpServer = createServer(app);

// Trust proxy — needed behind Nginx to get real client IPs for rate limiting
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";

// Build allowed origins from env (comma-separated) + sensible dev defaults
const allowedOrigins = [
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : []),
  ...(!isProduction ? ["http://localhost:3000", "http://localhost:3001"] : []),
].filter(Boolean);

// Build CSP connect-src from allowed origins (include ws/wss variants)
const cspConnectSrc = [
  "'self'",
  ...allowedOrigins.map((o) => o.replace(/^http/, "ws")),
  ...allowedOrigins,
];

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Content Security Policy — strict for API server (JSON only, no HTML)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // HSTS — force HTTPS, prevent downgrade attacks (production only)
  strictTransportSecurity: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  // Prevent clickjacking — no iframe embedding
  frameguard: { action: "deny" },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Prevent MIME-type sniffing
  noSniff: true,
  // Referrer policy — only send origin to same-origin
  referrerPolicy: { policy: "same-origin" },
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  // Origin Agent Cluster
  originAgentCluster: true,
}));

// ============================================================
// Headers not handled by Helmet v7 — set manually
// ============================================================
// Permissions-Policy — restrict browser features
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  // Disable caching of sensitive API responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ============================================================
// Strict CORS — env-driven whitelist, no hardcoded production domains
// ============================================================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOCKED] Origin rejected: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
    "Accept",
    "Origin",
    "x-trusted-device",
  ],
  exposedHeaders: [
    "RateLimit-Limit",
    "RateLimit-Remaining",
    "RateLimit-Reset",
    "Retry-After",
  ],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(compression());
app.use(morgan("combined"));
// Body parser limits — 1mb for general API, 10mb for health data (encrypted payloads)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
// Larger limit for health info routes (encrypted health data can be larger)
app.use("/api/health", express.json({ limit: "10mb" }));
app.use("/api/health", express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization — strip HTML/XSS + block NoSQL injection
const { sanitizeInput, mongoSanitizeMiddleware } = require("./middleware/sanitize");
app.use(mongoSanitizeMiddleware);
app.use(sanitizeInput);

// Static uploads — serve with security headers to prevent script execution
// When R2 is enabled, new uploads go to R2 but old local files may still exist
app.use("/uploads", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("X-Frame-Options", "DENY");
  next();
}, express.static(path.join(__dirname, "..", "uploads"), {
  maxAge: "7d",
  immutable: true,
}));

// General API rate limiting — configurable via env (dev: 10000 / 15 min, prod: 1000 / 15 min)
const { apiLimiter, authedLimiter } = require("./middleware/rateLimiter");
app.use("/api", apiLimiter);

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const spousePreferenceRoutes = require("./routes/spousePreference");
const verificationRoutes = require("./routes/verification");
const adminRoutes = require("./routes/admin");
const reportRoutes = require("./routes/report");
const complaintRoutes = require("./routes/complaint");
const matchRoutes = require("./routes/match");
const messageRoutes = require("./routes/message");
const subscriptionRoutes = require("./routes/subscription");
const paymentRoutes = require("./routes/payment");
const membershipPlanRoutes = require("./routes/membershipPlan");
const notificationRoutes = require("./routes/notification");
const healthRoutes = require("./routes/health");
const preferencesRoutes = require("./routes/preferences");
const conversationPermissionRoutes = require("./routes/conversationPermission");
const backupRoutes = require("./routes/backup");
const bookRoutes = require("./routes/book");
require("./utils/cleanup"); // schedules cleanup of old verification images
const { setupSocket } = require("./sockets/handler");
const { setSocket } = require("./utils/messageSocket");

// Initialize socket.io with optional Redis adapter (async)
setupSocket(io).then(({ io: socketIo }) => {
  setSocket(socketIo);
  console.log("[SERVER] Socket.io initialized");
}).catch((err) => {
  console.error("[SERVER] Socket.io initialization failed:", err.message);
  setSocket(io);
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", authedLimiter, profileRoutes);
app.use("/api/spouse-preference", authedLimiter, spousePreferenceRoutes);
app.use("/api/verification", authedLimiter, verificationRoutes);
app.use("/api/admin", authedLimiter, adminRoutes);
app.use("/api/admin", authedLimiter, require("./routes/adminManagement"));
app.use("/api/admin", authedLimiter, backupRoutes);
app.use("/api/reports", authedLimiter, reportRoutes);
app.use("/api/complaints", authedLimiter, complaintRoutes);
app.use("/api/matches", authedLimiter, matchRoutes);
app.use("/api/messages", authedLimiter, messageRoutes);
app.use("/api/subscriptions", authedLimiter, subscriptionRoutes);
app.use("/api/payments", authedLimiter, paymentRoutes);
app.use("/api/membership", authedLimiter, membershipPlanRoutes);
app.use("/api/notifications", authedLimiter, notificationRoutes);
app.use("/api/health", authedLimiter, healthRoutes);
app.use("/api/users/preferences", authedLimiter, preferencesRoutes);
app.use("/api/conversation-permissions", authedLimiter, conversationPermissionRoutes);
app.use("/api", bookRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api", (_req, res) => {
  res.json({ message: "Islamic Matchmaking Platform API v1.0" });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.includes("not allowed") || err?.message?.includes("Only ")) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

function startServer(attempt = 0) {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Start daily auto backup scheduler (midnight every day)
    const { startAutoBackupScheduler } = require("./utils/autoBackup");
    startAutoBackupScheduler();

    // Warn about admins without 2FA enabled
    const prisma = require("./config/database");
    prisma.user.findMany({
      where: { role: "admin", twoFactorEnabled: false, isActive: true },
      select: { email: true },
    }).then((admins) => {
      if (admins.length > 0) {
        console.warn(`[SECURITY] ${admins.length} admin(s) without 2FA enabled: ${admins.map((a) => a.email).join(", ")}`);
        console.warn("[SECURITY] These admins will be blocked from login until 2FA is enabled.");
      }
    }).catch(() => {});
  });

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE" && attempt < 3) {
      console.warn(`[SERVER] Port ${PORT} in use — killing stale process (attempt ${attempt + 1}/3)...`);
      try {
        const { execSync } = require("child_process");
        if (process.platform === "win32") {
          execSync(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${PORT}" ^| find "LISTENING"') do taskkill /F /PID %a`, { stdio: "ignore" });
        } else {
          execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: "ignore" });
        }
      } catch {}
      setTimeout(() => {
        httpServer.close(() => {});
        startServer(attempt + 1);
      }, 2000);
    } else {
      console.error(`[SERVER] Failed to start:`, err);
      process.exit(1);
    }
  });
}

startServer();

// Initialize R2 storage monitoring and retention cron jobs
try {
  const { initStorageCron } = require("./utils/storageMonitor");
  initStorageCron();
} catch (e) {
  console.log("[STORAGE] R2 monitoring not initialized:", e.message);
}

// ============================================================
// Graceful shutdown — handle PM2 restart / SIGTERM / SIGINT
// Closes all connections cleanly, prevents dropped requests
// ============================================================
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Graceful shutdown initiated...`);

  // Close Socket.io connections
  io.close(() => {
    console.log("[SHUTDOWN] Socket.io closed.");
  });

  // Close Redis clients if connected
  try {
    const { closeRedisClients } = require("./config/redis");
    closeRedisClients().then(() => {
      console.log("[SHUTDOWN] Redis clients closed.");
    }).catch(() => {});
  } catch {}

  // Disconnect Prisma from PostgreSQL — prevents connection leaks
  try {
    const prisma = require("./config/database");
    prisma.$disconnect().then(() => {
      console.log("[SHUTDOWN] Prisma disconnected.");
    }).catch(() => {});
  } catch {}

  httpServer.close((err) => {
    if (err) {
      console.error("[SHUTDOWN] Error closing server:", err);
      process.exit(1);
    }
    console.log("[SHUTDOWN] HTTP server closed. All connections drained.");
    process.exit(0);
  });
  // Force exit after 10s if connections don't close
  setTimeout(() => {
    console.warn("[SHUTDOWN] Forcing exit after 10s timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Log errors but NEVER crash — keep the server alive no matter what
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err.message);
  console.error(err.stack);
  // Do NOT exit — keep serving requests
});
process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason?.message || reason);
  // Do NOT exit — keep serving requests
});

module.exports = { app, httpServer, io };
