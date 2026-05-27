import { describe, expect, it } from "vitest";

import { buildCoordinationFreezeReview } from "@/services/review/coordinationFreezeReview";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

describe("replay truth precedence", () => {
  it("freezes unsafe continuation on replay mismatch", () => {
    const dashboard = {
      runtimeContinuityState: "degraded",
      continuityConfidence: 0.4,
      operationalStability: "degraded",
      degradedSystems: [],
      activeRecoveries: [],
      pendingApprovals: [],
      blockedRecoveries: [],
      quarantinedExecutions: [],
      replayVerificationState: "DISPUTED",
      replayDivergenceCount: 1,
      leaseConflicts: [],
      auditHistory: [{ id: "audit_1" }],
      governanceDisputes: [],
      certificationState: "BLOCKED",
      simulationOutcomes: [],
      continuityRiskScore: 0.7,
      stewardship: null,
      operationalStabilityAssessment: null,
      escalationCoordination: null,
      continuityConvergence: {
        converged: false,
        state: "FROZEN",
        divergenceScore: 0.9,
        divergenceReasons: ["replay_divergence"],
        requiresContainment: true,
        requiresEscalation: true,
        requiresFreeze: true,
        continuityConfidence: 0.2,
        replayConfidence: 0.1,
        survivabilityConfidence: 0.2,
        escalationStabilityConfidence: 0.2,
        affectedExecutions: [],
        affectedSubsystems: [],
        orphanedOperations: [],
        staleOwnershipClaims: [],
        unresolvedDisputes: ["replay_mismatch_unresolved"],
        unstableDependencies: [],
        evidence: ["lineage_1"],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      recoveryPrioritization: null,
      generatedAt: "2026-05-09T00:00:00.000Z",
    } satisfies RecoveryDashboardReadModel;

    const review = buildCoordinationFreezeReview({ dashboard });
    expect(review.reviewState).toBe("FROZEN");
    expect(review.blockedReasons).toContain("replay_mismatch_unresolved");
  });
});
