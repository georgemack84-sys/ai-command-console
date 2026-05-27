import { describe, expect, it } from "vitest";

import { determineSamDegradedMode } from "../../services/sam/scaling/samDegradedMode.ts";
import { loadSamRuntimeLimits } from "../../services/sam/scaling/samRuntimeLimits.ts";

describe("sam degraded mode", () => {
  it("returns NORMAL for healthy runtime state", () => {
    const mode = determineSamDegradedMode({
      queueDepth: 0,
      concurrentProposals: 0,
      concurrentDryRuns: 0,
      pendingRetries: 0,
      retryCount: 0,
      auditAppendLatencyMs: 10,
      idempotencyStoreLatencyMs: 10,
      memoryPressure: 0.1,
      limits: loadSamRuntimeLimits(),
    });

    expect(mode).toBe("NORMAL");
  });

  it("escalates deterministically under pressure", () => {
    const limits = loadSamRuntimeLimits({ MAX_QUEUE_DEPTH: 10, MAX_MEMORY_PRESSURE_THRESHOLD: 0.7 });
    const mode = determineSamDegradedMode({
      queueDepth: 10,
      concurrentProposals: 5,
      concurrentDryRuns: 2,
      pendingRetries: 6,
      retryCount: 3,
      auditAppendLatencyMs: 300,
      idempotencyStoreLatencyMs: 200,
      memoryPressure: 0.8,
      limits,
    });

    expect(mode).toBe("FROZEN");
  });
});
