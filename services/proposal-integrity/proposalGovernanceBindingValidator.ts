import type { ProposalGovernanceBinding, ProposalIntegrityError } from "./proposalIntegrityStateTypes";

export function validateProposalGovernanceBinding(
  binding: ProposalGovernanceBinding,
): readonly ProposalIntegrityError[] {
  if (binding.governanceSnapshotId && binding.governanceBound) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "PROPOSAL_GOVERNANCE_SNAPSHOT_MISSING",
    message: "Governance snapshot binding is incomplete.",
    path: "governanceSnapshotId",
  }]);
}
