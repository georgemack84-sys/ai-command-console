import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production builds isolated from the live development server on Windows.
  // Next writes a trace file in its output root that cannot be shared safely.
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
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
      // Generated service binaries and local agent worktrees are not part of
      // the Next.js runtime. Excluding them prevents standalone tracing from
      // recursively walking multi-gigabyte build artifacts on Windows.
      "services/api/**/bin/**",
      "services/api/**/obj/**",
      "services/api/**/artifacts/**",
      "artifacts/**",
      ".codex-temp/**",
      ".codex-worktrees/**",
    ],
  },
  // Next 16's standalone trace misses two internal runtime directories that
  // are loaded dynamically when its server starts on Windows.
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/next/dist/server/dev/browser-logs/**",
      "node_modules/next/dist/lib/metadata/**",
    ],
  },
  // Keep Turbopack's workspace traversal inside this application. Without an
  // explicit root on this Windows host it walks ancestor directories, causing
  // the production compiler to consume unbounded memory before it can finish.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
