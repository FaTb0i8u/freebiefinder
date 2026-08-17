import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next-pwa is incompatible with Next.js 16 Turbopack.
  // PWA installability is handled via /public/manifest.json.
  // Full offline service worker can be added when a Turbopack-compatible
  // PWA solution is available (e.g. @ducanh2912/next-pwa with Turbopack support).
};

export default nextConfig;
