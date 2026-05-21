// ─── Service Worker v4 ───────────────────────────────────────────────────────
const CACHE_VERSION = "v4";
const STATIC_CACHE  = `static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `images-${CACHE_VERSION}`;

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  // Skip waiting immediately — activate right away without waiting for tabs to close
  self.skipWaiting();
  // No precache network requests — they block SW activation and slow first load.
  // Assets are cached on first use instead (see fetch handler below).
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Message handler (for SKIP_WAITING from layout.tsx) ───────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from same origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never intercept API calls — always fresh from network
  if (url.pathname.startsWith("/api/")) return;

  // Never intercept HMR websocket or webpack internals
  if (url.pathname.startsWith("/_next/webpack")) return;

  // ── Next.js static assets: cache-first, populate on first use ────────────
  // These are content-hashed so they never go stale.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // ── HTML navigation: network-first, NO HTML caching ──────────────────────
  // Caching HTML causes the mobile reload loop (stale HTML → wrong JS hashes).
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // ── manifest.json / icons: cache-first ───────────────────────────────────
  if (url.pathname === "/manifest.json" || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // Everything else: network only (safe default)
});
