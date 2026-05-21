import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
  },

  // ── Server packages ───────────────────────────────────────────────────────
  serverExternalPackages: ["mongoose"],

  // ── Compiler ─────────────────────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
    // inlineCss removed — causes hydration mismatches on some Next.js versions
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: true },
    ];
  },

  // ── HTTP Cache Headers ────────────────────────────────────────────────────
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      ...(isProd ? [{
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      }] : []),
      {
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
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },

  turbopack: {},
};

module.exports = nextConfig;
