import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // ── Images ──────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    // Serve AVIF first (50% smaller than WebP), then WebP, then original
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 30 days in the browser
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Disable blur placeholder — it adds an extra base64 data URI to every image
    dangerouslyAllowSVG: false,
  },

  // ── External packages that must run in Node (not Edge) ──────────────────
  serverExternalPackages: ["mongoose"],

  // ── Compiler optimisations ───────────────────────────────────────────────
  compiler: {
    // Remove console.log in production — reduces bundle size
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ── HTTP headers ─────────────────────────────────────────────────────────
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      // /_next/static — content-hashed, safe to cache forever.
      // Only apply in production to avoid the dev-mode warning.
      ...(isProd ? [{
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      }] : []),
      {
        // sw.js must never be cached — always re-fetch so updates apply immediately
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        // /icons/ folder — PNG icons, safe to cache for 7 days
        source: "/icons/:slug",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        // Root-level icon PNGs (icon-192.png, icon-512.png, etc.)
        source: "/:slug(icon-:rest).png",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        // API — never cache at CDN/proxy level
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },

  turbopack: {},
};

module.exports = withPWA(nextConfig);
