import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadModule() {
  vi.resetModules();
  return import("../../services/sam/samFeatureFlags.ts");
}

describe("sam feature flags", () => {
  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("disabled S.A.M. returns false by default", async () => {
    process.env = { ...originalEnv };
    delete process.env.SAM_ENABLED;

    const { loadSamFeatureFlags } = await loadModule();
    expect(loadSamFeatureFlags().enabled).toBe(false);
  });

  it("dryRun defaults true", async () => {
    process.env = {
      ...originalEnv,
      SAM_ENABLED: "true",
    };

    const { loadSamFeatureFlags } = await loadModule();
    expect(loadSamFeatureFlags().dryRun).toBe(true);
    expect(loadSamFeatureFlags().requireApproval).toBe(true);
    expect(loadSamFeatureFlags().samIdempotencyEnabled).toBe(true);
    expect(loadSamFeatureFlags().samRetrySafetyEnabled).toBe(true);
    expect(loadSamFeatureFlags().samAuditDeduplicationEnabled).toBe(true);
    expect(loadSamFeatureFlags().samDurableIdempotencyEnabled).toBe(false);
  });

  it("real execution flag is forced false in 3.6A", async () => {
    process.env = {
      ...originalEnv,
      SAM_ENABLED: "true",
      SAM_REAL_EXECUTION_ENABLED: "true",
    };

    const { loadSamFeatureFlags } = await loadModule();
    expect(loadSamFeatureFlags().realExecutionEnabled).toBe(false);
  });
});
