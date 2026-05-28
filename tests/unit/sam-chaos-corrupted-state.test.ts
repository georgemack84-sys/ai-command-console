import { describe, expect, it } from "vitest";

import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

describe("sam chaos corrupted state", () => {
  it("CORRUPTED_STATE_READ blocks replay", async () => {
    const result = await runSamChaosScenario({
      type: "CORRUPTED_STATE_READ",
      executionId: "demo-chaos-corrupt",
      attemptId: "attempt-corrupt",
      deterministicSeed: "seed-corrupt",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryCorrect).toBe(true);
  });

  it("CORRUPTED_STATE_READ treats hash mismatch as conflict", async () => {
    const result = await runSamChaosScenario({
      type: "CORRUPTED_STATE_READ",
      executionId: "demo-chaos-corrupt-2",
      attemptId: "attempt-corrupt-2",
      deterministicSeed: "seed-corrupt-2",
      dryRun: true,
    });

    expect(result.findings.join(" ")).toContain("proposal hash mismatch treated as conflict");
  });
});
