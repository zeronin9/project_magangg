import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.1.23',
        port: '3001',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.16',
        port: '3001',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/uploads/**',
      },
    ],
  },
};

export default nextConfig;