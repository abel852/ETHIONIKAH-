const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

const onlineUsers = new Map();

// Production-configurable limits
const MAX_SOCKET_CONNECTIONS = parseInt(process.env.MAX_SOCKET_CONNECTIONS || "500", 10);
const MAX_CONNECTIONS_PER_USER = parseInt(process.env.MAX_CONNECTIONS_PER_USER || "3", 10);
const SOCKET_PING_INTERVAL = parseInt(process.env.SOCKET_PING_INTERVAL || "25000", 10);
const SOCKET_PING_TIMEOUT = parseInt(process.env.SOCKET_PING_TIMEOUT || "60000", 10);

// Track total connections for global cap
let totalConnections = 0;
let redisAdapterEnabled = false;

async function setupSocket(io) {
  // Configure socket.io engine for production
  io.engine.pingInterval = SOCKET_PING_INTERVAL;
  io.engine.pingTimeout = SOCKET_PING_TIMEOUT;

  // ============================================================
  // Redis adapter — enables socket state sharing across multiple
  // Node.js processes (PM2 cluster mode). Falls back gracefully
  // to in-memory adapter when Redis is not available.
  // ============================================================
  if (process.env.REDIS_URL) {
    try {
      const { getRedisClients } = require("../config/redis");
      const { pubClient, subClient } = await getRedisClients();
      if (pubClient && subClient) {
        const { createAdapter } = require("@socket.io/redis-adapter");
        io.adapter(createAdapter(pubClient, subClient));
        redisAdapterEnabled = true;
        console.log("[SOCKET] Redis adapter enabled — multi-process socket sharing active");
      } else {
        console.log("[SOCKET] Redis disabled — using in-memory adapter (single-process mode)");
      }
    } catch (err) {
      console.warn(`[SOCKET] Redis adapter failed, using in-memory adapter: ${err.message}`);
    }
  } else {
    console.log("[SOCKET] REDIS_URL not set — using in-memory adapter (single-process mode)");
  }

  io.use((socket, next) => {
    // Enforce global connection cap
    if (totalConnections >= MAX_SOCKET_CONNECTIONS) {
      console.warn(`[SOCKET] Max connections reached (${totalConnections}/${MAX_SOCKET_CONNECTIONS}) — rejecting new connection`);
      return next(new Error("Server is at maximum capacity. Please try again shortly."));
    }

    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    totalConnections++;

    // Enforce per-user connection cap — prevent connection flooding
    const userSockets = io.sockets.adapter.rooms.get(`user:${userId}`);
    if (userSockets && userSockets.size >= MAX_CONNECTIONS_PER_USER) {
      console.warn(`[SOCKET] Per-user connection limit reached for ${userId} (${userSockets.size}/${MAX_CONNECTIONS_PER_USER}) — disconnecting`);
      socket.disconnect(true);
      totalConnections--;
      return;
    }

    const wasOffline = !onlineUsers.has(userId);
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // Broadcast online status only to users who have conversations with this user
    if (wasOffline) {
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        select: { senderId: true, receiverId: true },
        distinct: ["senderId", "receiverId"],
        take: 200,
      }).then((msgs) => {
        const partnerIds = new Set();
        for (const m of msgs) {
          if (m.senderId !== userId) partnerIds.add(m.senderId);
          if (m.receiverId !== userId) partnerIds.add(m.receiverId);
        }
        partnerIds.forEach((pid) => {
          io.to(`user:${pid}`).emit("user_status", { userId, isOnline: true });
        });
      }).catch(() => {});
    }

    // Typing events
    socket.on("typing", ({ conversationId }) => {
      socket.to(`user:${conversationId}`).emit("typing", { conversationId: userId, isTyping: true });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(`user:${conversationId}`).emit("typing", { conversationId: userId, isTyping: false });
    });

    socket.on("disconnect", () => {
      totalConnections = Math.max(0, totalConnections - 1);
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        // Notify only conversation partners, not all users
        prisma.message.findMany({
          where: {
            OR: [
              { senderId: userId },
              { receiverId: userId },
            ],
          },
          select: { senderId: true, receiverId: true },
          distinct: ["senderId", "receiverId"],
          take: 200,
        }).then((msgs) => {
          const partnerIds = new Set();
          for (const m of msgs) {
            if (m.senderId !== userId) partnerIds.add(m.senderId);
            if (m.receiverId !== userId) partnerIds.add(m.receiverId);
          }
          partnerIds.forEach((pid) => {
            io.to(`user:${pid}`).emit("user_status", { userId, isOnline: false });
          });
        }).catch(() => {});
      }
    });

    // Handle connection errors to prevent memory leaks
    socket.on("error", (err) => {
      console.error(`[SOCKET] Error for user ${userId}:`, err.message);
    });
  });

  return { io, onlineUsers };
}

function emitToUser(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
}

function getSocketStats() {
  return {
    totalConnections,
    onlineUsers: onlineUsers.size,
    maxConnections: MAX_SOCKET_CONNECTIONS,
    maxPerUser: MAX_CONNECTIONS_PER_USER,
    redisAdapter: redisAdapterEnabled,
  };
}

module.exports = { setupSocket, emitToUser, onlineUsers, getSocketStats };