import type { ProposalFreezeError, ProposalFreezeInput } from "./types/proposalFreezeTypes";

export function validateProposalFreezeApprovals(
  input: ProposalFreezeInput,
): readonly ProposalFreezeError[] {
  const errors: ProposalFreezeError[] = [];
  const expectedApprovalLineage = input.proposalIntegrityResult.approvalBinding.approvalHash;
  const declaredApprovalLineage = input.proposalStateEngineInput.transition.approvalLineageId;

  if (declaredApprovalLineage && declaredApprovalLineage !== expectedApprovalLineage) {
    errors.push({
      code: "PROPOSAL_FREEZE_APPROVAL_LINEAGE_INSTABILITY",
      message: "Proposal approval lineage diverged from immutable approval ancestry.",
      path: "transition.approvalLineageId",
    });
  }

  const lineageTail = input.proposalStateEngineResult.lineage.approvalLineageIds.at(-1);
  if (lineageTail && lineageTail !== expectedApprovalLineage) {
    errors.push({
      code: "PROPOSAL_FREEZE_APPROVAL_LINEAGE_INSTABILITY",
      message: "Proposal state lineage appended an approval lineage that does not match immutable approval binding.",
      path: "proposalStateEngineResult.lineage.approvalLineageIds",
    });
  }

  return Object.freeze(errors);
}
