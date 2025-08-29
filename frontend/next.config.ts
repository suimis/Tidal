import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ['127.0.0.1'],
  },
};

export default nextConfig;
