import { routeApprovalAwareCoordination } from "@/services/approval-aware-coordination-router";
import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

export function buildApprovalAwareRoutingFixture(overrides: Partial<{
  containmentState: "safe" | "restricted" | "frozen";
  approvalStatus: import("@/types/proposal-lifecycle-engine").ProposalApprovalStatus;
  approvalValid: boolean;
  currentCoordinationState: string;
  targetCoordinationState: string;
  requestedTransition: string;
  metadata: Readonly<Record<string, unknown>>;
  priorRoutingLineageIds: string[];
  existingLineage: import("@/types/approval-aware-coordination-router").RoutingLineage;
}> = {}) {
  const constitutionalFixture = buildConstitutionalCoordinationFixture({
    metadata: overrides.metadata,
  });
  const proposal = constitutionalFixture.containmentFixture.missionFixture.input.proposal;
  const requestedTransition = overrides.requestedTransition ?? "escalation_bound->coordinated";
  const [defaultCurrentState, defaultTargetState] = requestedTransition.split("->");
  const input = Object.freeze({
    proposalId: proposal.proposalId,
    coordinationId: constitutionalFixture.record.coordinationId,
    requestedTransition,
    currentCoordinationState: overrides.currentCoordinationState ?? defaultCurrentState ?? constitutionalFixture.record.coordinationState,
    targetCoordinationState: overrides.targetCoordinationState ?? defaultTargetState ?? "coordinated",
    governanceSnapshotId: constitutionalFixture.record.governanceSnapshotId,
    replaySnapshotId: constitutionalFixture.record.replaySnapshotId,
    escalationSnapshotId: constitutionalFixture.record.escalationSnapshotId,
    containmentState: overrides.containmentState ?? "safe",
    approvalState: Object.freeze({
      approvalId: proposal.approval.approvalId,
      status: overrides.approvalStatus ?? "approved",
      explicit: proposal.approval.explicit,
      approvers: proposal.approval.approvers,
      scopeHash: proposal.approval.scopeHash,
      governanceDecisionHash: proposal.approval.governanceDecisionHash,
      valid: overrides.approvalValid ?? true,
    }),
    priorRoutingLineageIds: overrides.priorRoutingLineageIds ?? [],
    timestamp: "2026-05-17T12:00:00.000Z",
    existingLineage: overrides.existingLineage,
    metadata: overrides.metadata,
  });
  return {
    constitutionalFixture,
    input,
    result: routeApprovalAwareCoordination(input),
  };
}
