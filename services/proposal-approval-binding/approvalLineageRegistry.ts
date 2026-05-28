import type {
  ApprovalBinding,
  ApprovalLineage,
  ApprovalRevocation,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";
import { hashApprovalValue } from "./approvalHashEngine";

export function buildApprovalLineage(input: {
  engineInput: ProposalApprovalBindingInput;
  binding: ApprovalBinding;
  auditEventIds: readonly string[];
  revocation?: ApprovalRevocation;
  overrideBindingId?: string;
}): ApprovalLineage {
  const proposalId = input.engineInput.proposalIntegrityResult.proposal.proposalId;
  const lineageCore = {
    lineageId: `approval-lineage:${proposalId}`,
    proposalId,
    approvalIds: Object.freeze(input.engineInput.approvals.map((approval) => approval.approvalId)),
    dependencyIds: Object.freeze(
      input.engineInput.approvals.map((approval) => approval.dependencySnapshotId),
    ),
    replayIds: Object.freeze([input.engineInput.proposalReplayResult.replay.replayId]),
    governanceSnapshotIds: Object.freeze([
      input.engineInput.proposalGovernanceBindingResult.binding.governanceSnapshotId,
    ]),
    authorityBoundaryIds: Object.freeze([
      input.engineInput.proposalGovernanceBindingResult.authorityBoundary.authorityBoundaryId,
    ]),
    overrideBindingIds: Object.freeze(
      input.overrideBindingId ? [input.overrideBindingId] : [],
    ),
    revocationIds: Object.freeze(
      input.revocation ? [input.revocation.revocationId] : [],
    ),
    auditEventIds: Object.freeze([...input.auditEventIds]),
    createdAt: input.engineInput.existingLineage?.createdAt ?? input.engineInput.evaluatedAt,
    updatedAt: input.engineInput.evaluatedAt,
  };

  return Object.freeze({
    ...lineageCore,
    lineageHash: hashApprovalValue("approval-lineage", lineageCore),
  });
}
