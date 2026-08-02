/**
 * IndexedDB wrapper with TTL support for client-side caching.
 * Stores: conversations, messages, profile, notifications, membership, featureToggles
 * Never stores: passwords, tokens, verification docs, payment info.
 */

const DB_NAME = "ethionikah-cache";
const DB_VERSION = 1;

export const CACHE_TTL = {
  CONVERSATIONS: 2 * 60 * 1000,      // 2 minutes
  MESSAGES: 30 * 1000,                // 30 seconds
  PROFILE: 5 * 60 * 1000,             // 5 minutes
  NOTIFICATIONS: 60 * 1000,           // 1 minute
  MEMBERSHIP: 10 * 60 * 1000,         // 10 minutes
  FEATURE_TOGGLES: 5 * 60 * 1000,     // 5 minutes
  PUBLIC_PAGES: 24 * 60 * 60 * 1000,  // 24 hours
} as const;

export const STORES = {
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  PROFILE: "profile",
  NOTIFICATIONS: "notifications",
  MEMBERSHIP: "membership",
  FEATURE_TOGGLES: "featureToggles",
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB not available"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
        db.createObjectStore(STORES.CONVERSATIONS, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const msgStore = db.createObjectStore(STORES.MESSAGES, { keyPath: "conversationId" });
        msgStore.createIndex("by_conversation", "conversationId", { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.PROFILE)) {
        db.createObjectStore(STORES.PROFILE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
        db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.MEMBERSHIP)) {
        db.createObjectStore(STORES.MEMBERSHIP, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.FEATURE_TOGGLES)) {
        db.createObjectStore(STORES.FEATURE_TOGGLES, { keyPath: "key" });
      }
    };
  });
}

interface CacheEntry<T> {
  key?: string;
  conversationId?: string;
  data: T;
  timestamp: number;
  ttl: number;
}

export async function cacheGet<T>(store: StoreName, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) return resolve(null);
        if (Date.now() - entry.timestamp > entry.ttl) {
          resolve(null); // stale — return null, caller will refresh
        } else {
          resolve(entry.data);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function cacheGetStale<T>(store: StoreName, key: string): Promise<{ data: T; isStale: boolean } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) return resolve(null);
        const isStale = Date.now() - entry.timestamp > entry.ttl;
        resolve({ data: entry.data, isStale });
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function cacheSet<T>(store: StoreName, key: string, data: T, ttl: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      const entry: CacheEntry<T> = { key, data, timestamp: Date.now(), ttl };
      tx.objectStore(store).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silently fail — caching is non-critical
  }
}

export async function cacheSetByConversation<T>(store: StoreName, conversationId: string, data: T, ttl: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      const entry: CacheEntry<T> = { conversationId, data, timestamp: Date.now(), ttl };
      tx.objectStore(store).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silently fail
  }
}

export async function cacheGetByConversation<T>(store: StoreName, conversationId: string): Promise<{ data: T; isStale: boolean } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(conversationId);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) return resolve(null);
        const isStale = Date.now() - entry.timestamp > entry.ttl;
        resolve({ data: entry.data, isStale });
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function cacheDelete(store: StoreName, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function cacheClear(store: StoreName): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function cacheClearAll(): Promise<void> {
  try {
    const db = await openDB();
    const storeNames = Object.values(STORES);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, "readwrite");
      for (const name of storeNames) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Cache-first-then-refresh: returns stale data immediately if available,
 * then fetches fresh data and calls onUpdate if data changed.
 */
export async function cacheFirstRefresh<T>(
  store: StoreName,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  onUpdate?: (data: T) => void,
): Promise<T | null> {
  // Try to get cached data (even if stale)
  const cached = await cacheGetStale<T>(store, key);

  if (cached) {
    // Return cached data immediately
    if (cached.isStale) {
      // Background refresh
      fetcher()
        .then((fresh) => {
          cacheSet(store, key, fresh, ttl);
          onUpdate?.(fresh);
        })
        .catch(() => {});
    }
    return cached.data;
  }

  // No cache — fetch fresh
  try {
    const fresh = await fetcher();
    cacheSet(store, key, fresh, ttl);
    return fresh;
  } catch {
    return null;
  }
}
