import { describe, expect, it } from "vitest";

import { validateRecoverySimulationContinuity } from "../../../../services/recovery/simulation/recoverySimulationContinuityValidator";

describe("recovery simulation continuity validator", () => {
  it("detects stale execution and continuity drift", () => {
    const result = validateRecoverySimulationContinuity({
      scenarioType: "STALE_EXECUTION_RECOVERY",
      replayDeterministic: false,
      continuitySnapshots: [
        {
          snapshotId: "snapshot-1",
          runtimeState: "DEGRADED",
          activeExecutions: 1,
          degradedDependencies: [],
          staleLocks: 2,
          recoveryInProgress: true,
          continuityRiskScore: 70,
          survivabilityScore: 25,
          replayDivergenceDetected: true,
          workerAvailabilityScore: 40,
          dependencyStabilityScore: 50,
          timestamp: "2026-05-08T12:00:00.000Z",
        },
      ],
      ledgerEvents: [{ sequence: 1, eventType: "execution.failed", eventPayload: { checkpointState: "failed" } }],
      checkpointState: "completed",
      replayResult: {
        deterministic: false,
        reconstructedStates: ["failed"],
        replaySequence: ["execution.failed"],
      },
    });

    expect(result.validated).toBe(false);
    expect(result.disputes).toContain("CHECKPOINT_DIVERGENCE");
  });
});
