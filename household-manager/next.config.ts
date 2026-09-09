import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_HOUSEHOLD_BASE_PATH || undefined,
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
