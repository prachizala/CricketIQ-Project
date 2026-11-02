import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/model',
        destination: '/how-it-works',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
