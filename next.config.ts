import type { NextConfig } from "next";

// Force restart


const nextConfig: NextConfig = {
  // output: 'standalone', // Caution: Breaks static assets serving in `next start` locally
  images: {
    domains: ['images.unsplash.com']
  }
};

export default nextConfig;
