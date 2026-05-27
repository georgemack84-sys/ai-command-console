import { describe, expect, it } from "vitest";

import { aggregateRuntimeHealth } from "../../services/runtime/runtimeHealthAggregator";

describe("runtime health aggregator", () => {
  it("marks stable telemetry as healthy", () => {
    const state = aggregateRuntimeHealth({
      activeExecutions: 1,
      staleLocks: 0,
      activeLocks: 1,
      recoveryBacklog: 0,
      recoveryInProgress: false,
      replayDivergenceDetected: false,
      workerAvailabilityScore: 1,
      dependencyStabilityScore: 1,
      degradedDependencies: [],
      startupReady: true,
      startupSummary: "ready",
      criticalFailures: 0,
      disputedFailures: 0,
      degradedSubsystems: 0,
      timestamp: "2026-05-08T00:00:00.000Z",
    });

    expect(state.runtimeState).toBe("HEALTHY");
    expect(state.recoveryEligible).toBe(true);
  });

  it("quarantines replay divergence", () => {
    const state = aggregateRuntimeHealth({
      activeExecutions: 2,
      staleLocks: 1,
      activeLocks: 2,
      recoveryBacklog: 1,
      recoveryInProgress: true,
      replayDivergenceDetected: true,
      workerAvailabilityScore: 0.5,
      dependencyStabilityScore: 0.6,
      degradedDependencies: ["database"],
      startupReady: true,
      startupSummary: "ready",
      criticalFailures: 1,
      disputedFailures: 1,
      degradedSubsystems: 2,
      timestamp: "2026-05-08T00:00:00.000Z",
    });

    expect(state.runtimeState).toBe("QUARANTINED");
    expect(state.recoveryEligible).toBe(false);
  });
});
