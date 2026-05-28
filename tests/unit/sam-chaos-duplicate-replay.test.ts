import { describe, expect, it } from "vitest";

import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

describe("sam chaos duplicate replay", () => {
  it("DUPLICATE_REPLAY returns stored result", async () => {
    const result = await runSamChaosScenario({
      type: "DUPLICATE_REPLAY",
      executionId: "demo-chaos-replay",
      attemptId: "attempt-replay",
      deterministicSeed: "seed-replay",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryCorrect).toBe(true);
  });

  it("DUPLICATE_REPLAY does not rerun dry-run", async () => {
    const result = await runSamChaosScenario({
      type: "DUPLICATE_REPLAY",
      executionId: "demo-chaos-replay-2",
      attemptId: "attempt-replay-2",
      deterministicSeed: "seed-replay-2",
      dryRun: true,
    });

    expect(result.duplicateDryRunDetected).toBe(false);
  });

  it("DUPLICATE_REPLAY does not append duplicate audit", async () => {
    const result = await runSamChaosScenario({
      type: "DUPLICATE_REPLAY",
      executionId: "demo-chaos-replay-3",
      attemptId: "attempt-replay-3",
      deterministicSeed: "seed-replay-3",
      dryRun: true,
    });

    expect(result.duplicateAuditDetected).toBe(false);
  });
});
