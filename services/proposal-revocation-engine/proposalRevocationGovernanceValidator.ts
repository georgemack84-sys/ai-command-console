import type { ProposalRevocationError, ProposalRevocationInput } from "./proposalRevocationTypes";

export function validateProposalRevocationGovernance(
  input: ProposalRevocationInput,
): readonly ProposalRevocationError[] {
  const errors: ProposalRevocationError[] = [];
  const expected = input.proposalIntegrityResult.proposal.governanceSnapshotId;
  const request = input.request.governanceSnapshotId;
  const state = input.proposalStateEngineResult.governanceBinding.governanceSnapshotId;
  const enforcement = input.constitutionalEnforcementResult.lineage.governanceSnapshotId;

  if (!request) {
    errors.push({
      code: "PROPOSAL_REVOCATION_GOVERNANCE_SNAPSHOT_MISSING",
      message: "Revocation requires an explicit governance snapshot.",
      path: "request.governanceSnapshotId",
    });
  }

  if (request !== expected || request !== state || request !== enforcement) {
    errors.push({
      code: "PROPOSAL_REVOCATION_GOVERNANCE_MISMATCH",
      message: "Governance lineage drifted across proposal integrity, proposal state, and constitutional enforcement.",
      path: "request.governanceSnapshotId",
    });
  }

  return Object.freeze(errors);
}
