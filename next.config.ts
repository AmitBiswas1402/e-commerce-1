import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@arcjet/next", "@arcjet/analyze", "@arcjet/analyze-wasm"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
