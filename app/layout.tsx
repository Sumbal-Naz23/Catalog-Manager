import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D.K Collection — Catalog Manager",
  description: "Manage your premium product catalog.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "D.K Collection",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "D.K Collection",
    description: "Luxury in Every Detail.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        {/*
          dns-prefetch for MongoDB Atlas — reduces DNS lookup time on first API call.
          The actual hostname will vary but this covers the common Atlas pattern.
        */}
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
      </head>
      <body className="antialiased">
        {children}

        {/*
          SW registration is deferred until after page is interactive.
          Using setTimeout(0) yields to the main thread so React hydration
          completes first — critical on low-end Android where JS is slow.
        */}
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (!('serviceWorker' in navigator)) return;
  // Defer SW registration until after first paint + hydration
  setTimeout(function() {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(function(reg) {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        reg.addEventListener('updatefound', function() {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function() {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(function() {});
  }, 0);
})();
            `,
          }}
        />
      </body>
    </html>
  );
}
