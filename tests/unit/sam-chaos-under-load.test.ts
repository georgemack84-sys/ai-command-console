import { beforeEach, describe, expect, it } from "vitest";

import { runSamLoadScenario } from "../../services/sam/load/samLoadRunner.ts";
import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";
import { clearSamAuditDeduplicationState } from "../../services/sam/samAuditDeduplication.ts";
import { clearSamChaosFailureInjection } from "../../services/sam/chaos/samFailureInjection.ts";

describe("sam chaos under load", () => {
  beforeEach(() => {
    clearSamIdempotencyStore();
    clearSamAuditDeduplicationState();
    clearSamChaosFailureInjection();
  });

  it("keeps chaos scenarios deterministic under load", async () => {
    const result = await runSamLoadScenario({
      type: "CHAOS_UNDER_LOAD",
      executionId: "demo-chaos-load",
      attemptId: "attempt-chaos-load",
      deterministicSeed: "seed-chaos-load",
      dryRun: true,
      iterations: 2,
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.governanceBypassDetected).toBe(false);
  });
});
