import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: ["logo.clearbit.com"],
  },
};

export default nextConfig;
