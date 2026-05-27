import { describe, expect, it } from "vitest";

import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

describe("sam chaos partial write", () => {
  it("PARTIAL_WRITE creates ambiguous or blocked state", async () => {
    const result = await runSamChaosScenario({
      type: "PARTIAL_WRITE",
      executionId: "demo-chaos-partial",
      attemptId: "attempt-partial",
      deterministicSeed: "seed-partial",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryCorrect).toBe(true);
  });

  it("PARTIAL_WRITE does not allow retry to rerun dry-run", async () => {
    const result = await runSamChaosScenario({
      type: "PARTIAL_WRITE",
      executionId: "demo-chaos-partial-2",
      attemptId: "attempt-partial-2",
      deterministicSeed: "seed-partial-2",
      dryRun: true,
    });

    expect(result.duplicateDryRunDetected).toBe(false);
  });
});
