import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/studio',
        destination: 'http://localhost:3333',
        permanent: false,
      },
      {
        source: '/studio/:path*',
        destination: 'http://localhost:3333/:path*',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
