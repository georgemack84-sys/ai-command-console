import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const applicationRoot = path.dirname(fileURLToPath(import.meta.url));
const householdManagerOrigin =
  process.env.HOUSEHOLD_MANAGER_INTERNAL_ORIGIN?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  // `npm --prefix apps/web run dev` does not change process.cwd(). Anchor the
  // compiler to this app rather than accidentally serving the root legacy app.
  turbopack: { root: applicationRoot },
  async rewrites() {
    if (!householdManagerOrigin) return [];

    return [
      {
        source: '/household-manager',
        destination: `${householdManagerOrigin}/household-manager`,
      },
      {
        source: '/household-manager/:path*',
        destination: `${householdManagerOrigin}/household-manager/:path*`,
      },
    ];
  },
};

export default nextConfig;
