import { describe, expect, it } from "vitest";

import { buildConstitutionalSimulation } from "@/services/simulation/constitutionalSimulationEngine";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

const dashboard: RecoveryDashboardReadModel = {
  runtimeContinuityState: "stable",
  continuityConfidence: 0.7,
  operationalStability: "stable",
  degradedSystems: ["governance"],
  activeRecoveries: [{ executionId: "exec_1" }],
  pendingApprovals: [{ id: "approval_1" }],
  blockedRecoveries: [],
  quarantinedExecutions: [],
  replayVerificationState: "VERIFIED",
  replayDivergenceCount: 0,
  leaseConflicts: [],
  auditHistory: [{ id: "audit_1" }],
  governanceDisputes: [{ disputeId: "dispute_1" }],
  certificationState: "REVIEW",
  simulationOutcomes: [],
  continuityRiskScore: 0.4,
  stewardship: {
    state: "REVIEW",
    confidence: 0.7,
    shouldFreeze: false,
    shouldContain: false,
    shouldEscalate: true,
    governanceBlocked: false,
    verificationBlocked: false,
    stabilizationStatus: "review",
    survivabilityScore: 0.7,
    collapseRisk: "MEDIUM",
    reasoning: [],
    evidence: [],
  },
  operationalStabilityAssessment: null,
  escalationCoordination: null,
  continuityConvergence: null,
  recoveryPrioritization: null,
  generatedAt: "2026-05-09T00:00:00.000Z",
};

describe("governance conflict simulation", () => {
  it("stays deterministic and read-only", () => {
    const result = buildConstitutionalSimulation({ dashboard, nowMs: 5 });

    expect(result.readOnly).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.results.find((entry) => entry.simulationType === "governance_conflict")?.constitutionalSafe).toBe(false);
  });
});
