import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ['127.0.0.1'],
  },
  // 将 /coze/ad 页面设置为动态渲染，不进行静态预渲染
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
