import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "*": [
      "data/**",
      "data/**/*.sqlite",
      "data/**/*.sqlite-shm",
      "data/**/*.sqlite-wal",
      "logs/**",
      "memory/**",
      "backups/**",
    ],
  },
  experimental: {
    prerenderEarlyExit: false,
    serverMinification: false,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
