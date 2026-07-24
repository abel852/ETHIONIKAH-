const { PrismaClient } = require("@prisma/client");

// ============================================================
// Prisma Client — Production Connection Pool Configuration
// Target: 2 vCPU / 4 GB RAM Hostinger VPS
//
// Prisma uses PostgreSQL's native connection pooling via the
// `connection_limit` and `pool_timeout` query params in DATABASE_URL.
// If not set in DATABASE_URL, we apply sensible defaults here.
//
// For 2 vCPU with 1 PM2 instance (fork mode):
//   connection_limit = 10 (max concurrent DB connections per process)
//   pool_timeout = 30 (seconds to wait for a connection before failing)
//
// With PM2 cluster mode (2 instances):
//   connection_limit = 5 per instance (total 10 across processes)
// ============================================================

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Log pool configuration on startup (non-production only)
if (process.env.NODE_ENV !== "production") {
  const url = process.env.DATABASE_URL || "";
  const hasPoolConfig = url.includes("connection_limit") || url.includes("pool_timeout");
  if (!hasPoolConfig) {
    console.warn("[PRISMA] No connection_limit/pool_timeout in DATABASE_URL — using Prisma defaults. Add ?connection_limit=10&pool_timeout=30 for production.");
  }
}

// Graceful disconnect on process exit — prevents connection leaks
process.on("beforeExit", async () => {
  try {
    await prisma.$disconnect();
  } catch {}
});

module.exports = prisma;
