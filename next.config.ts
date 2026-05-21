import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
  },

  // ── Server packages (must run in Node, not Edge) ──────────────────────────
  serverExternalPackages: ["mongoose"],

  // ── Compiler ─────────────────────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    // Tree-shake these packages at import time — reduces bundle size
    optimizePackageImports: ["react", "react-dom"],
  },

  // ── HTTP Cache Headers ────────────────────────────────────────────────────
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      // Next.js static assets are content-hashed — safe to cache forever
      ...(isProd
        ? [
            {
              source: "/_next/static/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
          ]
        : []),
      {
        // sw.js: never cache — must always be fresh for SW updates to work
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/icons/:slug",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        // API responses: never cache at CDN/proxy level
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },

  turbopack: {},
};

module.exports = withPWA(nextConfig);
