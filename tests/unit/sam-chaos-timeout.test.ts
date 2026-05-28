import { describe, expect, it } from "vitest";

import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

describe("sam chaos timeout", () => {
  it("TIMEOUT_MID_EXECUTION does not become success", async () => {
    const result = await runSamChaosScenario({
      type: "TIMEOUT_MID_EXECUTION",
      executionId: "demo-chaos-timeout",
      attemptId: "attempt-timeout",
      deterministicSeed: "seed-timeout",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryCorrect).toBe(true);
  });

  it("TIMEOUT_MID_EXECUTION does not open real execution", async () => {
    const result = await runSamChaosScenario({
      type: "TIMEOUT_MID_EXECUTION",
      executionId: "demo-chaos-timeout-2",
      attemptId: "attempt-timeout-2",
      deterministicSeed: "seed-timeout-2",
      dryRun: true,
    });

    expect(result.unauthorizedMutationDetected).toBe(false);
  });
});
