import { hashProposalTransitionValue } from "./proposalTransitionHasher";
import type {
  GovernanceBindingRecord,
  ProposalLifecycleLineage,
  ProposalTransitionDeclaration,
} from "./types/proposalStateTypes";

export function applyProposalLineageTransition(input: {
  existingLineage?: ProposalLifecycleLineage;
  transition: ProposalTransitionDeclaration;
  resultingState: ProposalLifecycleLineage["currentState"];
  governanceBinding: GovernanceBindingRecord;
  replayLineageId: string;
  auditEventId: string;
  updatedAt: string;
}): ProposalLifecycleLineage {
  const lineage = input.existingLineage;

  return {
    lineageId: lineage?.lineageId ?? `proposal-lineage:${input.transition.proposalId}`,
    proposalId: input.transition.proposalId,
    currentState: input.resultingState,
    transitionIds: [...(lineage?.transitionIds ?? []), input.transition.transitionId],
    governanceSnapshotIds: [...(lineage?.governanceSnapshotIds ?? []), input.governanceBinding.governanceSnapshotId],
    replayLineageIds: [...(lineage?.replayLineageIds ?? []), input.replayLineageId],
    approvalLineageIds: [
      ...(lineage?.approvalLineageIds ?? []),
      ...(input.transition.approvalLineageId ? [input.transition.approvalLineageId] : []),
    ],
    dependencyLineageIds: [
      ...(lineage?.dependencyLineageIds ?? []),
      ...(input.transition.dependencyLineageId ? [input.transition.dependencyLineageId] : []),
    ],
    auditEventIds: [...(lineage?.auditEventIds ?? []), input.auditEventId],
    createdAt: lineage?.createdAt ?? input.updatedAt,
    updatedAt: input.updatedAt,
  };
}

export function buildInitialProposalLineage(input: {
  proposalId: string;
  currentState: ProposalLifecycleLineage["currentState"];
  createdAt: string;
}): ProposalLifecycleLineage {
  return {
    lineageId: `proposal-lineage:${input.proposalId}:${hashProposalTransitionValue("proposal-state-lineage-id", input).slice(0, 12)}`,
    proposalId: input.proposalId,
    currentState: input.currentState,
    transitionIds: [],
    governanceSnapshotIds: [],
    replayLineageIds: [],
    approvalLineageIds: [],
    dependencyLineageIds: [],
    auditEventIds: [],
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}
