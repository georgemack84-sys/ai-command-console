import { beforeEach, describe, expect, it } from "vitest";

import { evaluateSamBackpressure } from "../../services/sam/scaling/samBackpressureController.ts";
import { resetSamPerformanceMetrics, getSamPerformanceSnapshot } from "../../services/sam/performance/samPerformanceMetrics.ts";
import { loadSamRuntimeLimits } from "../../services/sam/scaling/samRuntimeLimits.ts";

describe("sam backpressure controller", () => {
  beforeEach(() => {
    resetSamPerformanceMetrics();
  });

  it("activates frozen mode when queue depth exceeds the limit", () => {
    const limits = loadSamRuntimeLimits({ MAX_QUEUE_DEPTH: 3 });
    const decision = evaluateSamBackpressure({
      queueDepth: 4,
      concurrentProposals: 1,
      concurrentDryRuns: 0,
      retryCount: 0,
      pendingRetries: 0,
      auditAppendLatencyMs: 10,
      idempotencyStoreLatencyMs: 10,
      memoryPressure: 0.2,
      limits,
    });

    expect(decision.mode).toBe("FROZEN");
    expect(decision.shouldReject).toBe(true);
    expect(getSamPerformanceSnapshot().counters["sam.backpressure.activations"]).toBe(1);
  });

  it("throttles deterministically before full saturation", () => {
    const limits = loadSamRuntimeLimits({ MAX_QUEUE_DEPTH: 10, MAX_CONCURRENT_SAM_PROPOSALS: 4 });
    const decision = evaluateSamBackpressure({
      queueDepth: 8,
      concurrentProposals: 3,
      concurrentDryRuns: 1,
      retryCount: 1,
      pendingRetries: 1,
      auditAppendLatencyMs: 20,
      idempotencyStoreLatencyMs: 20,
      memoryPressure: 0.5,
      limits,
    });

    expect(decision.mode).toBe("THROTTLED");
    expect(decision.shouldThrottle).toBe(true);
    expect(decision.shouldReject).toBe(false);
  });
});
