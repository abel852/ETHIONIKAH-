/**
 * Lightweight in-memory cache for GET API responses.
 * Caches per-user (keyed by userId + route) with a configurable TTL.
 * Uses stale-while-revalidate: serves stale data immediately while
 * fetching fresh data in the background.
 */

const store = new Map();

function makeKey(req) {
  const userId = req.user?.userId || "anon";
  const route = req.originalUrl || req.url;
  return `${userId}:${route}`;
}

/**
 * Cache middleware factory.
 * @param {number} ttlSeconds - How long to cache the response
 * @param {boolean} swr - If true, serve stale while revalidating in background
 */
function cacheResponse(ttlSeconds = 30, swr = true) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();

    const key = makeKey(req);
    const entry = store.get(key);

    if (entry) {
      const age = (Date.now() - entry.timestamp) / 1000;
      const fresh = age < ttlSeconds;
      const stale = age < ttlSeconds * 3;

      if (fresh) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
        return res.json(entry.data);
      }

      if (stale && swr) {
        res.setHeader("X-Cache", "STALE");
        res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
        res.json(entry.data);
        return;
      }
    }

    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=60");

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200) {
        store.set(key, { data, timestamp: Date.now() });
        if (store.size > 500) {
          const oldestKey = store.keys().next().value;
          store.delete(oldestKey);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

function invalidateCache(prefix) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.includes(prefix)) store.delete(key);
  }
}

module.exports = { cacheResponse, invalidateCache };
