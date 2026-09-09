import type { NextConfig } from 'next';

const householdManagerOrigin = process.env.HOUSEHOLD_MANAGER_INTERNAL_ORIGIN?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: { root: process.cwd() },
  async rewrites() {
    if (!householdManagerOrigin) return [];

    return [
      { source: '/household-manager', destination: `${householdManagerOrigin}/household-manager` },
      { source: '/household-manager/:path*', destination: `${householdManagerOrigin}/household-manager/:path*` },
    ];
  },
};

export default nextConfig;
