import { beforeEach, describe, expect, it } from "vitest";

import { runSamLoadScenario } from "../../services/sam/load/samLoadRunner.ts";
import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";
import { clearSamAuditDeduplicationState } from "../../services/sam/samAuditDeduplication.ts";

describe("sam retry storm", () => {
  beforeEach(() => {
    clearSamIdempotencyStore();
    clearSamAuditDeduplicationState();
  });

  it("keeps duplicate replay contained under retry pressure", async () => {
    const result = await runSamLoadScenario({
      type: "RETRY_STORM",
      executionId: "demo-retry-storm",
      attemptId: "attempt-retry-storm",
      deterministicSeed: "seed-retry-storm",
      dryRun: true,
      iterations: 4,
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.duplicateDryRunDetected).toBe(false);
    expect(result.metrics.duplicateAuditDetected).toBe(false);
  });
});
