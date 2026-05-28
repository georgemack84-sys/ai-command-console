import type {
  ProposalLifecycleLineage,
  ProposalStateError,
} from "./types/proposalStateTypes";

export function validateProposalLineageIntegrity(input: {
  proposalId: string;
  currentState: string;
  existingLineage?: ProposalLifecycleLineage;
}): readonly ProposalStateError[] {
  const lineage = input.existingLineage;
  if (!lineage) {
    return Object.freeze([]);
  }

  const errors: ProposalStateError[] = [];

  if (lineage.proposalId !== input.proposalId) {
    errors.push({
      code: "PROPOSAL_STATE_LINEAGE_DISPUTED",
      message: "Existing proposal lineage belongs to a different proposal.",
      path: "existingLineage.proposalId",
    });
  }
  if (lineage.currentState !== input.currentState) {
    errors.push({
      code: "PROPOSAL_STATE_SOURCE_MISMATCH",
      message: "Existing lineage current state diverges from the declared current state.",
      path: "existingLineage.currentState",
    });
  }

  const expectedLength = lineage.transitionIds.length;
  if (
    lineage.governanceSnapshotIds.length !== expectedLength
    || lineage.replayLineageIds.length !== expectedLength
    || lineage.auditEventIds.length !== expectedLength
    || lineage.approvalLineageIds.length > expectedLength
    || lineage.dependencyLineageIds.length > expectedLength
  ) {
    errors.push({
      code: "PROPOSAL_STATE_LINEAGE_DISPUTED",
      message: "Existing proposal lineage arrays are no longer append-only aligned.",
      path: "existingLineage",
    });
  }

  return Object.freeze(errors);
}
