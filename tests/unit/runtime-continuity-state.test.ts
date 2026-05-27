import { describe, expect, it } from "vitest";

import { getRuntimeContinuityState } from "../../services/runtime/runtimeContinuityState";

describe("runtime continuity state", () => {
  it("derives a continuity state from telemetry", () => {
    const result = getRuntimeContinuityState({
      persistSnapshot: false,
      telemetry: {
        activeExecutions: 2,
        staleLocks: 0,
        activeLocks: 2,
        recoveryBacklog: 1,
        recoveryInProgress: true,
        replayDivergenceDetected: false,
        workerAvailabilityScore: 0.9,
        dependencyStabilityScore: 0.85,
        degradedDependencies: ["queue"],
        startupReady: true,
        startupSummary: "ready",
        criticalFailures: 0,
        disputedFailures: 0,
        degradedSubsystems: 1,
        timestamp: "2026-05-08T00:00:00.000Z",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.runtimeState).toBe("RECOVERING");
      expect(result.data.continuityConfidence).toBeGreaterThan(0.5);
    }
  });
});
