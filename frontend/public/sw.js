// ============================================================
// EthioNikah Service Worker
// - Cache API for static assets, images, fonts, public pages
// - Network-first for API calls (always fresh data)
// - Stale-while-revalidate for Next.js static assets
// - Push notification support
// - Offline fallback page
// ============================================================

const STATIC_CACHE = "ethionikah-static-v2";
const IMAGE_CACHE = "ethionikah-images-v2";
const PAGE_CACHE = "ethionikah-pages-v2";

// Static assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/login",
  "/register",
  "/about",
  "/contact",
  "/faq",
  "/manifest.webmanifest",
  "/icon.png",
  "/icon-192.png",
  "/icon-512.png",
];

// Install — precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {})),
      self.skipWaiting(),
    ])
  );
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

// Helper: stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper: cache-first strategy (for immutable static assets)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// Helper: network-first with cache fallback (for API calls)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    return new Response(
      JSON.stringify({ error: "You are offline. Please check your connection." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Fetch handler — route requests to appropriate caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip Chrome extension requests
  if (url.protocol === "chrome-extension:") return;

  // Development / localhost — never cache, let browser fetch fresh files from Next.js dev server
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;

  // API calls — network-first (never cache API responses in SW)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Socket.io — never cache
  if (url.pathname.startsWith("/socket.io/")) {
    return;
  }

  // Next.js static assets (_next/static) — cache-first (immutable, hashed)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Next.js image optimization — stale-while-revalidate
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Image files — stale-while-revalidate
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Font files — cache-first
  if (/\.(woff|woff2|ttf|eot|otf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Public pages — stale-while-revalidate for offline support
  const publicPaths = ["/", "/about", "/contact", "/faq", "/login", "/register", "/forgot-password", "/terms-of-service", "/privacy-policy", "/safety-guidelines", "/islamic-marriage-guide", "/books"];
  if (publicPaths.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
    return;
  }

  // All other routes (authenticated pages) — network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});

// Handle push events
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "EthioNikah", body: event.data ? event.data.text() : "New notification" };
  }

  const title = data.title || "EthioNikah";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.png",
    badge: data.badge || "/icon.png",
    tag: data.tag || "default",
    data: data.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          if (urlToOpen !== "/") {
            client.postMessage({ type: "NAVIGATE", url: urlToOpen });
          }
          return;
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Handle messages from the page (e.g., cache clear requests)
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      Promise.all([
        caches.delete(STATIC_CACHE),
        caches.delete(IMAGE_CACHE),
        caches.delete(PAGE_CACHE),
      ]).then(() => event.source?.postMessage({ type: "CACHE_CLEARED" }))
    );
  }
});
