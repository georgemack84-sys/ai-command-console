import { describe, expect, it } from "vitest";

import { SAM_RUNTIME_LIMITS, loadSamRuntimeLimits } from "../../services/sam/scaling/samRuntimeLimits.ts";

describe("sam runtime limits", () => {
  it("exports positive safe defaults", () => {
    expect(SAM_RUNTIME_LIMITS.MAX_CONCURRENT_SAM_PROPOSALS).toBeGreaterThan(0);
    expect(SAM_RUNTIME_LIMITS.MAX_CONCURRENT_DRY_RUNS).toBeGreaterThan(0);
    expect(SAM_RUNTIME_LIMITS.MAX_QUEUE_DEPTH).toBeGreaterThan(0);
    expect(SAM_RUNTIME_LIMITS.MAX_RETRY_ATTEMPTS).toBeGreaterThan(0);
  });

  it("loads deterministic overrides without mutating the defaults", () => {
    const limits = loadSamRuntimeLimits({ MAX_QUEUE_DEPTH: 2, MAX_RETRY_ATTEMPTS: 1 });
    expect(limits.MAX_QUEUE_DEPTH).toBe(2);
    expect(limits.MAX_RETRY_ATTEMPTS).toBe(1);
    expect(SAM_RUNTIME_LIMITS.MAX_QUEUE_DEPTH).not.toBe(2);
  });
});
