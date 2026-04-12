import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadEnvModule() {
  vi.resetModules();
  return import("@/src/config/env");
}

describe("env configuration", () => {
  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("uses the development auth secret fallback for local builds", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public",
      NEXT_PUBLIC_APP_URL: "http://localhost:5050",
    };
    delete process.env.AI_COMMAND_CONSOLE_AUTH_SECRET;

    const { env } = await loadEnvModule();

    expect(env.AI_COMMAND_CONSOLE_AUTH_SECRET).toBe("ai-command-console-dev-only-secret");
  });

  it("fails closed for non-local production deployments without an auth secret", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://app:secret@db.internal:5432/ai_command_console?schema=public",
      NEXT_PUBLIC_APP_URL: "https://pulse.example.com",
    };
    delete process.env.AI_COMMAND_CONSOLE_AUTH_SECRET;

    await expect(loadEnvModule()).rejects.toThrow(
      "AI_COMMAND_CONSOLE_AUTH_SECRET must be configured for non-local production deployments.",
    );
  });

  it("disables legacy json mirrors by default outside test mode", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public",
      NEXT_PUBLIC_APP_URL: "http://localhost:5050",
      AI_COMMAND_CONSOLE_AUTH_SECRET: "local-development-secret-key-123",
    };

    const { writeLegacyJsonMirrorsEnabled } = await loadEnvModule();

    expect(writeLegacyJsonMirrorsEnabled()).toBe(false);
  });

  it("allows opting back into legacy json mirrors explicitly", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public",
      NEXT_PUBLIC_APP_URL: "http://localhost:5050",
      AI_COMMAND_CONSOLE_AUTH_SECRET: "local-development-secret-key-123",
      AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS: "true",
    };

    const { writeLegacyJsonMirrorsEnabled } = await loadEnvModule();

    expect(writeLegacyJsonMirrorsEnabled()).toBe(true);
  });
});
