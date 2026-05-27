import { describe, expect, it } from "vitest";

import { evaluateControlPlaneGovernance } from "@/services/governance/controlPlaneGovernance";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

function buildDashboard(overrides: Partial<RecoveryDashboardReadModel> = {}): RecoveryDashboardReadModel {
  return {
    runtimeContinuityState: "stable",
    continuityConfidence: 0.82,
    operationalStability: "stable",
    degradedSystems: [],
    activeRecoveries: [],
    pendingApprovals: [],
    blockedRecoveries: [],
    quarantinedExecutions: [],
    replayVerificationState: "VERIFIED",
    replayDivergenceCount: 0,
    leaseConflicts: [],
    auditHistory: [{ id: "audit-1" }],
    governanceDisputes: [],
    certificationState: "VERIFIED",
    simulationOutcomes: [],
    continuityRiskScore: 0.2,
    stewardship: {
      state: "SUPERVISED",
      confidence: 0.9,
      shouldFreeze: false,
      shouldContain: false,
      shouldEscalate: false,
      governanceBlocked: false,
      verificationBlocked: false,
      stabilizationStatus: "stable",
      survivabilityScore: 0.82,
      collapseRisk: "LOW",
      reasoning: [],
      evidence: [],
    },
    operationalStabilityAssessment: null,
    escalationCoordination: null,
    continuityConvergence: null,
    recoveryPrioritization: null,
    generatedAt: "2026-05-09T00:00:00.000Z",
    ...overrides,
  };
}

describe("evaluateControlPlaneGovernance", () => {
  it("fails closed on missing governance context", () => {
    const result = evaluateControlPlaneGovernance({
      dashboard: buildDashboard({ stewardship: null }),
      reviewType: "review",
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedReasons).toContain("CONTROL_PLANE_CONTEXT_MISSING");
  });

  it("blocks when replay mismatch or disputes are present", () => {
    const result = evaluateControlPlaneGovernance({
      dashboard: buildDashboard({
        governanceDisputes: [{ disputeId: "d1" }],
        continuityConvergence: {
          converged: false,
          state: "FROZEN",
          divergenceScore: 0.8,
          divergenceReasons: ["replay_divergence"],
          requiresContainment: true,
          requiresEscalation: true,
          requiresFreeze: true,
          continuityConfidence: 0.2,
          replayConfidence: 0.2,
          survivabilityConfidence: 0.2,
          escalationStabilityConfidence: 0.2,
          affectedExecutions: [],
          affectedSubsystems: [],
          orphanedOperations: [],
          staleOwnershipClaims: [],
          unresolvedDisputes: ["replay_mismatch_unresolved"],
          unstableDependencies: [],
          evidence: ["lineage:1"],
          timestamp: "2026-05-09T00:00:00.000Z",
        },
      }),
      reviewType: "review",
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedReasons).toContain("REPLAY_MISMATCH_UNRESOLVED");
    expect(result.blockedReasons).toContain("CONSTITUTIONAL_ENFORCEMENT_FAILED");
  });
});
