import { describe, expect, it } from "vitest";

import { evaluateRuntimeDegradation } from "../../services/runtime/runtimeDegradationTracker";

describe("runtime degradation tracker", () => {
  it("detects cascading degradation and recovery loops", () => {
    const assessment = evaluateRuntimeDegradation([
      {
        snapshotId: "one",
        runtimeState: "DEGRADED",
        activeExecutions: 1,
        degradedDependencies: ["queue"],
        staleLocks: 0,
        recoveryInProgress: true,
        continuityRiskScore: 35,
        survivabilityScore: 70,
        replayDivergenceDetected: false,
        workerAvailabilityScore: 0.9,
        dependencyStabilityScore: 0.8,
        timestamp: "2026-05-08T00:00:00.000Z",
      },
      {
        snapshotId: "two",
        runtimeState: "PARTIALLY_OPERATIONAL",
        activeExecutions: 2,
        degradedDependencies: ["queue", "database"],
        staleLocks: 1,
        recoveryInProgress: true,
        continuityRiskScore: 55,
        survivabilityScore: 55,
        replayDivergenceDetected: false,
        workerAvailabilityScore: 0.7,
        dependencyStabilityScore: 0.6,
        timestamp: "2026-05-08T00:01:00.000Z",
      },
      {
        snapshotId: "three",
        runtimeState: "RECOVERING",
        activeExecutions: 3,
        degradedDependencies: ["queue", "database", "observability"],
        staleLocks: 2,
        recoveryInProgress: true,
        continuityRiskScore: 72,
        survivabilityScore: 40,
        replayDivergenceDetected: false,
        workerAvailabilityScore: 0.5,
        dependencyStabilityScore: 0.45,
        timestamp: "2026-05-08T00:02:00.000Z",
      },
    ]);

    expect(assessment.degraded).toBe(true);
    expect(assessment.cascadingFailures).toBe(true);
    expect(assessment.recoveryLoopDetected).toBe(true);
  });
});
