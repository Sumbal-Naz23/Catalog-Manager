// import type { NextConfig } from "next";
// const withPWA = require("next-pwa")({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
// });

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "res.cloudinary.com",
//       },
//     ],
//   },
//   serverExternalPackages: ["mongoose"],
// };

// export default withPWA(nextConfig);


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
  },
  serverExternalPackages: ["mongoose"],

  // Raise the body size limit for API routes to 50 MB.
  // Next.js defaults to 4 MB which causes a plain-text 413 response that
  // breaks JSON.parse on the frontend.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  turbopack: {},
};

module.exports = withPWA(nextConfig);