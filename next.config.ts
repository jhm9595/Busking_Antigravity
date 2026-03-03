import type { NextConfig } from "next";

// Force restart


const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ]
  }
};

export default nextConfig;
