import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Serve modern formats (WebP/AVIF) automatically — smaller files = faster load
    formats: ["image/avif", "image/webp"],
    // Aggressive browser caching for Cloudinary images
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  serverExternalPackages: ["mongoose"],
  turbopack: {},
};

module.exports = withPWA(nextConfig);
