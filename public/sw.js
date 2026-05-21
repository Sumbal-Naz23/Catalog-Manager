// ─── Service Worker — v3 ─────────────────────────────────────────────────────
// Bumping the version clears the old stale cache that was causing
// infinite reload loops on mobile (old SW was serving stale HTML that
// triggered a fresh navigation, which the SW served stale again → loop).
const CACHE_VERSION = "v3";
const STATIC_CACHE  = `static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `images-${CACHE_VERSION}`;

const PRECACHE_URLS = ["/manifest.json"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  // Skip waiting immediately — don't hold onto old SW
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET or cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // 2. Never cache API calls — always go to network
  if (url.pathname.startsWith("/api/")) return;

  // 3. Never cache Next.js internal routes (_next/webpack-hmr, etc.)
  if (url.pathname.startsWith("/_next/webpack")) return;

  // 4. Cloudinary images — cache-first with long TTL
  if (url.hostname === "res.cloudinary.com") {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // 5. Next.js static assets (_next/static) — cache-first (they're content-hashed)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // 6. HTML navigation — NETWORK FIRST, no caching of HTML pages.
  //    This is the critical fix: caching HTML caused the mobile reload loop
  //    because the SW served stale HTML that pointed to old JS chunks.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        // Only fall back to cache if completely offline
        caches.match(request)
      )
    );
    return;
  }

  // 7. Everything else — network only (safe default)
});
