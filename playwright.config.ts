import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const playwrightDataRoot = path.join(process.cwd(), ".codex-temp", "playwright-data");

export default defineConfig({
  testDir: "./playwright",
  timeout: 30_000,
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:5050",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1200 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "node scripts/run-playwright-server.cjs",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public",
      AI_COMMAND_CONSOLE_DATA_ROOT: playwrightDataRoot,
      AI_COMMAND_CONSOLE_STORAGE_DRIVER: "sqlite",
      AI_COMMAND_CONSOLE_DATABASE_PATH: path.join(playwrightDataRoot, "workspace.sqlite"),
      AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH: path.join(playwrightDataRoot, "agents", "console.sqlite"),
      AI_COMMAND_CONSOLE_AUTH_SECRET: "playwright-local-auth-secret",
      AI_COMMAND_CONSOLE_SECURE_COOKIES: "false",
      NEXT_PUBLIC_APP_URL: "http://localhost:5050",
    },
    url: "http://localhost:5050",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
