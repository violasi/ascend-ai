import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow devtunnel / ngrok URLs in dev mode (Next.js 15 cross-origin protection)
  allowedDevOrigins: ["*.devtunnels.ms", "*.ngrok.io", "*.ngrok-free.app"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.cdnlogo.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: "/health", destination: `${BACKEND_URL}/health` },
    ];
  },
};

export default nextConfig;
