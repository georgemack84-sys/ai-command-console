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
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@opentelemetry[\\/]instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
};

export default nextConfig;
