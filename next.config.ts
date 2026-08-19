import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Every route is prerendered — there is no server code — so the app ships as
   * plain static files. That keeps hosting choices open (Firebase Hosting,
   * Vercel, any CDN) and lets the service worker cache the whole shell.
   */
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
