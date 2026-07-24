import type { NextConfig } from "next";

const apiHost = process.env.NEXT_PUBLIC_API_BASE_URL
  ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).hostname
  : 'localhost';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: apiHost,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: apiHost,
        pathname: '/uploads/**',
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
