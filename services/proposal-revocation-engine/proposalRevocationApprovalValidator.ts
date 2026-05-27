import type { ProposalRevocationError, ProposalRevocationInput } from "./proposalRevocationTypes";

export function validateProposalRevocationApprovals(
  input: ProposalRevocationInput,
): readonly ProposalRevocationError[] {
  const errors: ProposalRevocationError[] = [];
  const auditSnapshotId = input.request.auditSnapshotId;
  const expectedApproval = input.proposalIntegrityResult.approvalBinding.approvalHash;
  const lineageTail = input.proposalStateEngineResult.lineage.approvalLineageIds.at(-1);

  if (!auditSnapshotId) {
    errors.push({
      code: "PROPOSAL_REVOCATION_AUDIT_SNAPSHOT_MISSING",
      message: "Revocation requires an explicit audit snapshot.",
      path: "request.auditSnapshotId",
    });
  }

  if (input.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0 && !expectedApproval) {
    errors.push({
      code: "PROPOSAL_REVOCATION_APPROVAL_LINEAGE_INCOMPLETE",
      message: "Proposal approval lineage is incomplete and cannot support revocation.",
      path: "proposalIntegrityResult.approvalBinding",
    });
  }

  if (lineageTail !== undefined && lineageTail !== expectedApproval) {
    errors.push({
      code: "PROPOSAL_REVOCATION_APPROVAL_LINEAGE_INCOMPLETE",
      message: "Proposal state lineage no longer matches immutable approval ancestry.",
      path: "proposalStateEngineResult.lineage.approvalLineageIds",
    });
  }

  return Object.freeze(errors);
}
