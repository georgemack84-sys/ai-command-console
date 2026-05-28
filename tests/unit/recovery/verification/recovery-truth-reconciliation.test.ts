import { describe, expect, it } from "vitest";

import { reconcileRecoveryTruthState } from "../../../../services/recovery/verification/recoveryTruthReconciliation";

describe("recovery truth reconciliation", () => {
  it("reconciles aligned replay, governance, continuity, and simulation evidence", () => {
    const result = reconcileRecoveryTruthState({
      executionId: "exec-1",
      replayVerification: {
        verified: true,
        replayIntegrity: true,
        governanceIntegrity: true,
        continuityIntegrity: true,
        evidence: ["ledger:present"],
        disputes: [],
      },
      simulation: {
        simulationId: "sim-1",
        executionId: "exec-1",
        scenarioType: "CRASH_RECOVERY",
        state: "COMPLETED",
        outcome: "RECOVERY_VALID",
        warnings: [],
        disputes: [],
        evidenceIds: ["simulation_evidence_1"],
        auditEventIds: ["audit-1"],
        timestamp: "2026-05-08T12:00:00.000Z",
        recommendedAction: "ALLOW_RECOVERY_PATTERN",
        dryRun: true,
      },
      continuityState: {
        runtimeState: "HEALTHY",
        continuityConfidence: 0.92,
        recoveryEligible: true,
        recoveryReadiness: 0.9,
        degradedDependencies: [],
        activeExecutions: 1,
        staleLocks: 0,
        replayDivergenceDetected: false,
        dependencyStabilityScore: 0.95,
        workerAvailabilityScore: 0.96,
        survivabilityScore: 90,
        updatedAt: "2026-05-08T12:00:00.000Z",
      },
      immutableEvidenceValid: true,
      divergenceSummary: {
        divergenceDetected: false,
        disputes: [],
        governanceDisputes: [],
        replayDivergenceCount: 0,
      },
      timestamp: "2026-05-08T12:00:00.000Z",
    });

    expect(result.reconciliationState).toBe("RECONCILED");
    expect(result.disputed).toBe(false);
  });

  it("fails closed when required evidence is missing", () => {
    const result = reconcileRecoveryTruthState({
      executionId: "exec-1",
      replayVerification: null,
      simulation: null,
      continuityState: null,
      immutableEvidenceValid: false,
      divergenceSummary: {
        divergenceDetected: false,
        disputes: [],
        governanceDisputes: [],
        replayDivergenceCount: 0,
      },
      timestamp: "2026-05-08T12:00:00.000Z",
    });

    expect(result.reconciliationState).toBe("UNVERIFIABLE");
    expect(result.disputed).toBe(true);
  });
});
