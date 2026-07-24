import type { NextConfig } from "next";

let apiHost = 'localhost';
try {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    apiHost = new URL(process.env.NEXT_PUBLIC_API_BASE_URL).hostname;
  }
} catch {
  // Fallback to localhost if URL is malformed
}

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
