import { routeApprovalAwareCoordination } from "@/services/approval-aware-coordination-router";
import { buildBoundedOrchestrationRecord } from "@/services/bounded-orchestration-framework";
import type { ApprovalAwareRoutingResult, RoutingLineage } from "@/types/approval-aware-coordination-router";
import type { BoundedOrchestrationChronology } from "@/types/bounded-orchestration-framework";
import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

export function buildBoundedOrchestrationFixture(overrides: Partial<{
  createdAt: string;
  containmentState: "safe" | "restricted" | "frozen";
  requestedTransition: string;
  approvalValid: boolean;
  approvalStatus: import("@/types/proposal-lifecycle-engine").ProposalApprovalStatus;
  metadata: Readonly<Record<string, unknown>>;
  existingLineage: RoutingLineage | BoundedOrchestrationChronology;
  existingRoutingLineage: RoutingLineage;
  existingChronology: BoundedOrchestrationChronology;
  routingResult: ApprovalAwareRoutingResult;
}> = {}) {
  const constitutionalFixture = buildConstitutionalCoordinationFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });
  const proposal = constitutionalFixture.containmentFixture.missionFixture.input.proposal;
  const requestedTransition = overrides.requestedTransition ?? "escalation_bound->coordinated";
  const [currentCoordinationState, targetCoordinationState] = requestedTransition.split("->");
  const routingInput = Object.freeze({
    proposalId: proposal.proposalId,
    coordinationId: constitutionalFixture.record.coordinationId,
    requestedTransition,
    currentCoordinationState: currentCoordinationState ?? constitutionalFixture.record.coordinationState,
    targetCoordinationState: targetCoordinationState ?? "coordinated",
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
    priorRoutingLineageIds: [],
    timestamp: overrides.createdAt ?? "2026-05-17T12:00:00.000Z",
    existingLineage: overrides.existingRoutingLineage
      ?? (overrides.existingLineage && "lineageHash" in overrides.existingLineage
        ? overrides.existingLineage
        : undefined),
    metadata: overrides.metadata,
  });
  const routingResult = overrides.routingResult ?? routeApprovalAwareCoordination(routingInput);
  const orchestrationInput = Object.freeze({
    orchestrationId: `orch-${constitutionalFixture.record.coordinationId}`,
    coordinationRecord: constitutionalFixture.record,
    routingResult,
    containmentValidation: constitutionalFixture.containmentFixture.record.validation,
    containmentHash: constitutionalFixture.containmentFixture.record.containmentHash,
    createdAt: overrides.createdAt ?? "2026-05-17T12:00:00.000Z",
    existingChronology: overrides.existingChronology
      ?? (overrides.existingLineage && "chronologyHash" in overrides.existingLineage
        ? overrides.existingLineage
        : undefined),
    humanSupremacyRecord: constitutionalFixture.containmentFixture.humanSupremacyRecord,
    metadata: overrides.metadata,
  });

  return {
    constitutionalFixture,
    routingInput,
    routingFixture: {
      input: routingInput,
      result: routingResult,
    },
    routingResult,
    orchestrationInput,
    record: buildBoundedOrchestrationRecord(orchestrationInput),
  };
}
