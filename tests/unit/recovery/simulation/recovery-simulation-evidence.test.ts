import { describe, expect, it } from "vitest";

import { buildRecoverySimulationEvidence } from "../../../../services/recovery/simulation/recoverySimulationEvidence";

describe("recovery simulation evidence", () => {
  it("generates deterministic evidence for every simulation", () => {
    const result = buildRecoverySimulationEvidence({
      request: {
        simulationId: "sim-1",
        executionId: "exec-1",
        scenarioType: "CRASH_RECOVERY",
        dryRun: true,
        createdAt: "2026-05-08T12:00:00.000Z",
      },
      scenario: {
        type: "CRASH_RECOVERY",
        recoveryAction: "replay",
        expectedWarnings: [],
        expectedDisputes: [],
      },
      replay: {
        replayDeterministic: true,
        divergenceDetected: false,
        confidence: 0.9,
        evidenceIds: ["replay:1"],
        warnings: [],
        disputes: [],
      },
      continuity: {
        validated: true,
        survivabilityScore: 88,
        warnings: [],
        disputes: [],
      },
      governance: {
        ok: true,
        warnings: [],
        disputes: [],
      },
      outcome: "RECOVERY_VALID",
      timestamp: "2026-05-08T12:00:00.000Z",
    });

    expect(result.evidenceIds).toHaveLength(1);
    expect(result.bundle.finalOutcome).toBe("RECOVERY_VALID");
  });
});
