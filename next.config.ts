import type { NextConfig } from "next";

const DEV_WATCH_IGNORE_PATTERNS = [
  "**/.codex-temp/**",
  "**/backups/**",
  "**/coverage/**",
  "**/data/**/*.sqlite",
  "**/data/**/*.sqlite-shm",
  "**/data/**/*.sqlite-wal",
  "**/logs/**",
  "**/memory/**",
  "**/playwright-report/**",
  "**/test-results/**",
] as const;

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["node_modules/next/dist/**/*"],
  },
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
  webpack: (config, { dev }) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@opentelemetry[\\/]instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: [...DEV_WATCH_IGNORE_PATTERNS],
      };
    }

    return config;
  },
};

export default nextConfig;
