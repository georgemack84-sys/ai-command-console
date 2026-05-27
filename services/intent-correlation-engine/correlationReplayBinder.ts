import type {
  CorrelationReplayBinding,
  IntentCorrelationError,
} from "@/types/intent-correlation-engine";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { ConstitutionalAutonomyReadinessGateRecord } from "@/services/constitutional-autonomy-readiness-gate";
import type { IntentCoordinationGovernanceRecord } from "@/types/intent-coordination-governance-core";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import { createCorrelationError } from "./correlationErrors";
import { hashCorrelationValue } from "./correlationHasher";

export function bindCorrelationReplay(input: {
  coordinationRecords: readonly IntentCoordinationGovernanceRecord[];
  proposals: readonly ProposalRecord[];
  readinessGates: readonly ConstitutionalAutonomyReadinessGateRecord[];
  escalations: readonly ConstitutionalEscalationRecord[];
  approvalGraphs: readonly ApprovalDependencyGraph[];
  createdAt: string;
}): Readonly<{
  replayBinding: CorrelationReplayBinding;
  errors: readonly IntentCorrelationError[];
}> {
  const sourceReplayIds = [
    ...input.coordinationRecords.map((record) => record.replayBinding.reconstructionHash),
    ...input.proposals.map((proposal) => proposal.replayBinding.reconstructionHash),
  ].sort();
  const firstCoordination = input.coordinationRecords[0];
  const firstReadiness = input.readinessGates[0];
  const firstProposal = input.proposals[0];
  const firstEscalation = input.escalations[0];
  const firstApproval = input.approvalGraphs[0];

  const valid =
    !!firstCoordination
    && !!firstReadiness
    && !!firstProposal
    && input.coordinationRecords.every((record) => record.replayBinding.governanceSnapshotHash === firstCoordination.replayBinding.governanceSnapshotHash)
    && input.readinessGates.every((gate) => gate.replayBinding.governanceSnapshotHash === firstReadiness.replayBinding.governanceSnapshotHash)
    && input.proposals.every((proposal) => proposal.governanceBinding.policySnapshotHash === firstProposal.governanceBinding.policySnapshotHash);

  const replayBinding: CorrelationReplayBinding = Object.freeze({
    replayBindingId: hashCorrelationValue("intent-correlation-replay-binding-id", {
      sourceReplayIds,
      createdAt: input.createdAt,
    }),
    sourceReplayIds: Object.freeze(sourceReplayIds),
    governanceSnapshotHash: firstCoordination?.replayBinding.governanceSnapshotHash ?? "",
    readinessCertificationHash: firstReadiness?.readinessHash ?? "",
    proposalLineageHash: firstProposal?.lineage.lineageId ?? "",
    escalationLineageHash: firstEscalation?.lineage.ledgerId,
    confidenceLineageHash: firstReadiness?.replayBinding.confidenceLineageHash,
    approvalLineageHash: firstApproval?.lineageHash,
    createdAt: input.createdAt,
    bindingHash: hashCorrelationValue("intent-correlation-replay-binding", {
      sourceReplayIds,
      governanceSnapshotHash: firstCoordination?.replayBinding.governanceSnapshotHash ?? "",
      readinessCertificationHash: firstReadiness?.readinessHash ?? "",
      proposalLineageHash: firstProposal?.lineage.lineageId ?? "",
      escalationLineageHash: firstEscalation?.lineage.ledgerId ?? "",
      confidenceLineageHash: firstReadiness?.replayBinding.confidenceLineageHash ?? "",
      approvalLineageHash: firstApproval?.lineageHash ?? "",
    }),
  });

  return Object.freeze({
    replayBinding,
    errors: Object.freeze(
      valid && sourceReplayIds.length > 0
        ? []
        : [createCorrelationError("PHASE_4_6B_CORRELATION_REPLAY_BINDING_MISSING", "Correlation replay binding requires original consistent replay inputs.", "replayBinding")],
    ),
  });
}
