import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateHistoricalProposalReplay(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  if (
    input.metadata?.presentStateSubstitution === true
    || input.metadata?.syntheticAncestry === true
    || input.metadata?.replayRepair === true
  ) {
    return Object.freeze([{
      code: "PROPOSAL_SYNTHETIC_ANCESTRY_DETECTED",
      message: "Historical replay may not use present-state or synthetic reconstruction.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
