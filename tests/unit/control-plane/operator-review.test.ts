import { describe, expect, it } from "vitest";

import { buildOperatorApprovalPacket } from "@/services/controlPlane/operatorApprovalWorkflow";
import { buildOperatorReviewQueue } from "@/services/controlPlane/operatorReviewQueue";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

const dashboard: RecoveryDashboardReadModel = {
  runtimeContinuityState: "degraded",
  continuityConfidence: 0.34,
  operationalStability: "degraded",
  degradedSystems: ["replay"],
  activeRecoveries: [],
  pendingApprovals: [{ id: "approval_1" }],
  blockedRecoveries: [],
  quarantinedExecutions: [],
  replayVerificationState: "DISPUTED",
  replayDivergenceCount: 2,
  leaseConflicts: [],
  auditHistory: [{ id: "audit_1" }],
  governanceDisputes: [{ disputeId: "dispute_1" }],
  certificationState: "BLOCKED",
  simulationOutcomes: [],
  continuityRiskScore: 0.7,
  stewardship: {
    state: "FROZEN",
    confidence: 0.2,
    shouldFreeze: true,
    shouldContain: true,
    shouldEscalate: true,
    governanceBlocked: true,
    verificationBlocked: true,
    stabilizationStatus: "blocked",
    survivabilityScore: 0.2,
    collapseRisk: "HIGH",
    reasoning: [],
    evidence: [],
  },
  operationalStabilityAssessment: null,
  escalationCoordination: {
    escalationId: "esc_1",
    escalationType: "governance",
    escalationState: "FROZEN",
    escalationSeverity: "HIGH",
    escalationLineageId: "lineage_1",
    conflictingEscalations: [],
    requiresContainment: true,
    requiresOperatorVisibility: true,
    frozen: true,
    blocked: true,
    blockReason: "coordination_freeze_active",
    recommendedActions: [],
    confidence: 0.3,
    evidenceCount: 1,
    reason: "freeze",
    source: "test",
    timestamp: "2026-05-09T00:00:00.000Z",
  },
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
    affectedSubsystems: ["replay"],
    orphanedOperations: [],
    staleOwnershipClaims: [],
    unresolvedDisputes: ["replay_mismatch_unresolved"],
    unstableDependencies: [],
    evidence: ["evidence_1"],
    timestamp: "2026-05-09T00:00:00.000Z",
  },
  recoveryPrioritization: null,
  generatedAt: "2026-05-09T00:00:00.000Z",
};

describe("operator review queue", () => {
  it("surfaces approvals, disputes, and freezes for review", () => {
    const queue = buildOperatorReviewQueue({ dashboard, nowMs: 1 });

    expect(queue.map((item) => item.reviewState)).toEqual(expect.arrayContaining(["PENDING_REVIEW", "DISPUTED", "FROZEN"]));
  });

  it("keeps approval packets read-dominant", () => {
    const queue = buildOperatorReviewQueue({ dashboard, nowMs: 1 });
    const packet = buildOperatorApprovalPacket(queue[0]);

    expect(packet.submissionEnabled).toBe(false);
    expect(packet.approvalRequired).toBe(true);
  });
});
