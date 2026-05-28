import { describe, expect, it } from "vitest";

import { computeContinuityRisk } from "../../services/runtime/continuityRiskEngine";

describe("continuity risk engine", () => {
  it("increases risk for replay divergence and stale locks", () => {
    const lowRisk = computeContinuityRisk({
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
    const highRisk = computeContinuityRisk({
      activeExecutions: 3,
      staleLocks: 2,
      activeLocks: 3,
      recoveryBacklog: 3,
      recoveryInProgress: true,
      replayDivergenceDetected: true,
      workerAvailabilityScore: 0.3,
      dependencyStabilityScore: 0.4,
      degradedDependencies: ["database"],
      startupReady: false,
      startupSummary: "database degraded",
      criticalFailures: 2,
      disputedFailures: 1,
      degradedSubsystems: 3,
      timestamp: "2026-05-08T00:00:00.000Z",
    });

    expect(highRisk).toBeGreaterThan(lowRisk);
    expect(highRisk).toBeGreaterThanOrEqual(80);
  });
});
