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
        {/* No external font requests — system fonts only, zero network cost */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(function(reg) {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        reg.addEventListener('updatefound', function() {
          var newSW = reg.installing;
          if (newSW) {
            newSW.addEventListener('statechange', function() {
              if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                newSW.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(function() {});
  });
}
            `,
          }}
        />
      </body>
    </html>
  );
}
