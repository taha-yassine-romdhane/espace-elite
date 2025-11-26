import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Add this output configuration
  output: 'standalone', // Required for Docker deployment
  // Keep your existing image config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '1q2z9d946v.ufs.sh',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow local images from imports directory
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Optional: Add transpilePackages if using Prisma
  transpilePackages: ['@prisma/client'],
};

export default nextConfig;