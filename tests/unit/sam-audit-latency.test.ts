import { describe, expect, it } from "vitest";

import { evaluateSamBackpressure } from "../../services/sam/scaling/samBackpressureController.ts";
import { loadSamRuntimeLimits } from "../../services/sam/scaling/samRuntimeLimits.ts";

describe("sam audit latency pressure", () => {
  it("escalates degraded mode when audit append latency spikes", () => {
    const limits = loadSamRuntimeLimits({ MAX_AUDIT_APPEND_LATENCY_MS: 50 });
    const decision = evaluateSamBackpressure({
      queueDepth: 1,
      concurrentProposals: 1,
      concurrentDryRuns: 0,
      retryCount: 0,
      pendingRetries: 0,
      auditAppendLatencyMs: 75,
      idempotencyStoreLatencyMs: 10,
      memoryPressure: 0.2,
      limits,
    });

    expect(["ELEVATED", "THROTTLED", "DEGRADED", "RESTRICTED", "FROZEN"]).toContain(decision.mode);
    expect(decision.reason).toContain("AUDIT");
  });
});
