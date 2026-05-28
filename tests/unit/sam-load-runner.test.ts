import { beforeEach, describe, expect, it } from "vitest";

import { runSamLoadScenario } from "../../services/sam/load/samLoadRunner.ts";
import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";
import { clearSamAuditDeduplicationState } from "../../services/sam/samAuditDeduplication.ts";
import { resetSamQueueGovernorState } from "../../services/sam/scaling/samQueueGovernor.ts";
import { resetSamPerformanceMetrics } from "../../services/sam/performance/samPerformanceMetrics.ts";

describe("sam load runner", () => {
  beforeEach(() => {
    clearSamIdempotencyStore();
    clearSamAuditDeduplicationState();
    resetSamQueueGovernorState();
    resetSamPerformanceMetrics();
  });

  it("runs a deterministic duplicate replay pressure scenario", async () => {
    const result = await runSamLoadScenario({
      type: "DUPLICATE_REPLAY_PRESSURE",
      executionId: "demo-load-1",
      attemptId: "attempt-load-1",
      deterministicSeed: "seed-load-1",
      dryRun: true,
      iterations: 3,
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.duplicateDryRunDetected).toBe(false);
  });
});
