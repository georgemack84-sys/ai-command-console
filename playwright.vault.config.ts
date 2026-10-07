import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env"), quiet: true });
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true, quiet: true });

function resolveVaultE2eDatabaseUrl() {
  if (process.env.PLAYWRIGHT_DATABASE_URL?.trim()) {
    return process.env.PLAYWRIGHT_DATABASE_URL.trim();
  }

  const target = new URL(
    process.env.DATABASE_URL?.trim() || "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public",
  );
  target.pathname = "/ai_command_console_playwright";
  return target.toString();
}
const port = Number(process.env.PLAYWRIGHT_PORT ?? "5053");
const baseURL = `http://localhost:${port}`;
const dataRoot = path.join(process.cwd(), ".codex-temp", "playwright-vault-data");
const databaseUrl = resolveVaultE2eDatabaseUrl();
// A distinct output root per port prevents a cancelled local run from leaving
// a Next development lock that blocks a subsequent retry on another port.
const distDir = `.next-vault-e2e-${port}`;

/** Dedicated Vault acceptance runner: isolated database, port, and Next output. */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "nuru-vault-governed-lifecycle.spec.ts",
  timeout: 90_000,
  outputDir: "test-results/vault-e2e",
  globalSetup: "./scripts/vault-e2e-global-setup.cjs",
  workers: 1,
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "vault-e2e", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1200 } } }],
  webServer: {
    command: `node scripts/run-playwright-server.cjs --webpack --port ${port}`,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      AI_COMMAND_CONSOLE_DATA_ROOT: dataRoot,
      NEXT_DIST_DIR: distDir,
      AI_COMMAND_CONSOLE_REPLACE_OWNED_DEV_SERVER: "1",
      AI_COMMAND_CONSOLE_STORAGE_DRIVER: "sqlite",
      AI_COMMAND_CONSOLE_DATABASE_PATH: path.join(dataRoot, "workspace.sqlite"),
      AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH: path.join(dataRoot, "agents", "console.sqlite"),
      AI_COMMAND_CONSOLE_AUTH_SECRET: "playwright-local-auth-secret",
      AI_COMMAND_CONSOLE_SECURE_COOKIES: "false",
      HEADLINE_FLOW_PROVIDER: "fixture",
      HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER: "true",
      AI_SUMMARY_PROVIDER_MODE: "mock",
      RATE_LIMIT_ENABLED: "false",
      SENTRY_DSN: "",
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_IMAGE_UNOPTIMIZED: "true",
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
