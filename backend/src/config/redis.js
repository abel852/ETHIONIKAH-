const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Skip Redis if URL contains placeholder credentials
const REDIS_ENABLED = REDIS_URL && !REDIS_URL.includes("YOUR_REDIS_PASSWORD") && !REDIS_URL.includes("YOUR_");

let pubClient = null;
let subClient = null;
let generalClient = null;
let connected = false;

async function getRedisClients() {
  if (!REDIS_ENABLED) {
    console.log("[REDIS] Disabled — URL not configured (placeholder credentials detected)");
    return { pubClient: null, subClient: null };
  }
  if (pubClient && subClient) return { pubClient, subClient };

  pubClient = createClient({ url: REDIS_URL });
  subClient = pubClient.duplicate();

  pubClient.on("error", (err) => {
    console.error("[REDIS] Pub client error:", err.message);
  });

  subClient.on("error", (err) => {
    console.error("[REDIS] Sub client error:", err.message);
  });

  pubClient.on("connect", () => {
    console.log("[REDIS] Pub client connected");
  });

  subClient.on("connect", () => {
    console.log("[REDIS] Sub client connected");
    connected = true;
  });

  pubClient.on("reconnecting", () => {
    console.log("[REDIS] Pub client reconnecting...");
  });

  subClient.on("reconnecting", () => {
    console.log("[REDIS] Sub client reconnecting...");
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);

  return { pubClient, subClient };
}

async function getGeneralClient() {
  if (!REDIS_ENABLED) return null;
  if (generalClient && generalClient.isOpen) return generalClient;

  generalClient = createClient({ url: REDIS_URL });

  generalClient.on("error", (err) => {
    console.error("[REDIS] General client error:", err.message);
  });

  generalClient.on("connect", () => {
    console.log("[REDIS] General client connected");
  });

  await generalClient.connect();
  return generalClient;
}

async function closeRedisClients() {
  if (pubClient) {
    await pubClient.quit().catch(() => {});
    pubClient = null;
  }
  if (subClient) {
    await subClient.quit().catch(() => {});
    subClient = null;
  }
  if (generalClient) {
    await generalClient.quit().catch(() => {});
    generalClient = null;
  }
  connected = false;
}

function isRedisConnected() {
  return connected;
}

module.exports = { getRedisClients, getGeneralClient, closeRedisClients, isRedisConnected, REDIS_URL };
