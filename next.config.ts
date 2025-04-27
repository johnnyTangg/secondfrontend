import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://8025-2600-1700-8465-8080-1046-157f-83e0-35b3.ngrok-free.app/:path*'
      }
    ];
  }
};

export default nextConfig;
