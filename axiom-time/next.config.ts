import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  // This app intentionally lives inside a larger workspace. Keep Turbopack's
  // filesystem boundary here so another Next application cannot share its build lock.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
