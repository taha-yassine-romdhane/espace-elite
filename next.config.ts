import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['1q2z9d946v.ufs.sh'], // Allow images from the uploadthing server
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '1q2z9d946v.ufs.sh',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;