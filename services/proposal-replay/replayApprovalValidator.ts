import type { ProposalReplayInput, ProposalReplayError } from "./replayTypes";

export function validateReplayApprovalSnapshots(
  input: ProposalReplayInput,
): readonly ProposalReplayError[] {
  const errors: ProposalReplayError[] = [];
  const approvalIds = input.proposalIntegrityResult.approvalBinding.approvalDependencyIds;

  if (approvalIds.length === 0) {
    errors.push({
      code: "PROPOSAL_REPLAY_APPROVAL_SNAPSHOT_MISSING",
      message: "Proposal replay cannot reconstruct immutable approval lineage without original approval snapshots.",
      path: "proposalIntegrityResult.approvalBinding.approvalDependencyIds",
    });
  }

  return Object.freeze(errors);
}
