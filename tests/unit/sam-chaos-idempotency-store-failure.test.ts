import { describe, expect, it } from "vitest";

import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

describe("sam chaos idempotency store failure", () => {
  it("IDEMPOTENCY_STORE_FAILURE blocks unsafe retry", async () => {
    const result = await runSamChaosScenario({
      type: "IDEMPOTENCY_STORE_FAILURE",
      executionId: "demo-chaos-store",
      attemptId: "attempt-store",
      deterministicSeed: "seed-store",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryCorrect).toBe(true);
  });

  it("IDEMPOTENCY_STORE_FAILURE does not allow dry-run continuation", async () => {
    const result = await runSamChaosScenario({
      type: "IDEMPOTENCY_STORE_FAILURE",
      executionId: "demo-chaos-store-2",
      attemptId: "attempt-store-2",
      deterministicSeed: "seed-store-2",
      dryRun: true,
    });

    expect(result.duplicateDryRunDetected).toBe(false);
  });
});
