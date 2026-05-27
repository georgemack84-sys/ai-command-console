import { describe, expect, it } from "vitest";

import { validateEnvironment } from "@/services/startup/validateEnvironment";

const baseEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mission?schema=public",
  NODE_ENV: "production",
  TENANT_MODE: "multi_tenant",
  LOCK_LEASE_MS: "30000",
  BACKUP_PATH: "C:/backups/mission-control",
  OBSERVABILITY_MODE: "full",
  SECURITY_MODE: "enforced",
  ADMIN_SECRET: "super-secret-admin-token-123",
  AI_COMMAND_CONSOLE_AUTH_SECRET: "production-auth-secret-token-123",
  CONTINUITY_VERIFICATION_ENABLED: "true",
  INTEGRITY_VALIDATION_ENABLED: "true",
  RESTORE_SIMULATION_ENABLED: "true",
  FAIL_FAST_ENABLED: "true",
  DEBUG_MODE: "false",
} as const;

function expectEnvironmentFailure(result: ReturnType<typeof validateEnvironment>) {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("Expected environment validation to fail.");
  }
  return result.error;
}

describe("environment schema", () => {
  it("fails when DATABASE_URL is missing", () => {
    const result = validateEnvironment({ ...baseEnv, DATABASE_URL: "" });
    expect(expectEnvironmentFailure(result).code).toBe("ENV_DATABASE_URL_MISSING");
  });

  it("rejects invalid NODE_ENV", () => {
    const result = validateEnvironment({ ...baseEnv, NODE_ENV: "chaos" });
    expect(expectEnvironmentFailure(result).code).toBe("ENV_NODE_ENV_INVALID");
  });

  it("rejects invalid TENANT_MODE", () => {
    const result = validateEnvironment({ ...baseEnv, TENANT_MODE: "maybe" });
    expect(expectEnvironmentFailure(result).code).toBe("ENV_TENANT_MODE_INVALID");
  });

  it("rejects invalid LOCK_LEASE_MS", () => {
    const result = validateEnvironment({ ...baseEnv, LOCK_LEASE_MS: "5" });
    expect(expectEnvironmentFailure(result).code).toBe("ENV_LOCK_LEASE_INVALID");
  });

  it("allows unrelated process environment keys outside the startup contract", () => {
    const result = validateEnvironment({
      ...baseEnv,
      PATH: "C:/Windows/System32",
      npm_lifecycle_event: "worker:jobs",
    });

    expect(result.ok).toBe(true);
  });

  it("requires SECURITY_MODE in production", () => {
    const result = validateEnvironment({ ...baseEnv, SECURITY_MODE: "disabled" });
    expect(expectEnvironmentFailure(result).code).toBe("ENV_SECURITY_MODE_DISABLED");
  });

  it("accepts the required production auth secret as a managed key", () => {
    const result = validateEnvironment({
      ...baseEnv,
      AI_COMMAND_CONSOLE_AUTH_SECRET: "production-auth-secret-token-456",
    });

    expect(result.ok).toBe(true);
  });

  it("accepts documented optional production app environment keys", () => {
    const result = validateEnvironment({
      ...baseEnv,
      AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL: "https://alerts.example.test/hook",
      AI_COMMAND_CONSOLE_STORAGE_DRIVER: "sqlite",
    });

    expect(result.ok).toBe(true);
  });

  it("fails closed when the production auth secret is missing", () => {
    const envWithoutAuthSecret: Record<string, string> = { ...baseEnv };
    delete envWithoutAuthSecret.AI_COMMAND_CONSOLE_AUTH_SECRET;
    const result = validateEnvironment(envWithoutAuthSecret);

    expect(expectEnvironmentFailure(result).code).toBe("ENV_AUTH_SECRET_INVALID");
  });

  it("rejects unknown production env keys in managed namespace", () => {
    const result = validateEnvironment({
      ...baseEnv,
      AI_COMMAND_CONSOLE_UNSAFE_FALLBACK: "1",
    });
    expect(expectEnvironmentFailure(result).code).toBe("ENV_UNKNOWN_KEY");
  });
});
