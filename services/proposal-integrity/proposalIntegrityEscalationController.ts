import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalIntegrityEscalation(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  return input.metadata?.uncertaintyAmplified === true
    || input.escalationDeterminismResult.record.oversightState === "disputed"
    ? Object.freeze([{
      code: "PROPOSAL_REPLAY_DRIFT_DETECTED",
      message: "Uncertainty increased oversight and froze proposal progression.",
      path: "oversightState",
    }])
    : Object.freeze([]);
}
