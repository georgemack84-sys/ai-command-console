import { beforeEach, describe, expect, it } from "vitest";

import { clearSamAuditDeduplicationState } from "../../services/sam/samAuditDeduplication.ts";
import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";
import { clearSamChaosFailureInjection } from "../../services/sam/chaos/samFailureInjection.ts";
import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

beforeEach(() => {
  clearSamChaosFailureInjection();
  clearSamIdempotencyStore();
  clearSamAuditDeduplicationState();
});

describe("sam chaos lock loss", () => {
  it("LOCK_LOSS blocks unsafe retry", async () => {
    const result = await runSamChaosScenario({
      type: "LOCK_LOSS",
      executionId: "demo-chaos-lock",
      attemptId: "attempt-lock",
      deterministicSeed: "seed-lock",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryCorrect).toBe(true);
  });

  it("LOCK_LOSS does not rerun dry-run", async () => {
    const result = await runSamChaosScenario({
      type: "LOCK_LOSS",
      executionId: "demo-chaos-lock-2",
      attemptId: "attempt-lock-2",
      deterministicSeed: "seed-lock-2",
      dryRun: true,
    });

    expect(result.duplicateDryRunDetected).toBe(false);
  });
});
