import type { NextConfig } from "next";

// Force restart


const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
