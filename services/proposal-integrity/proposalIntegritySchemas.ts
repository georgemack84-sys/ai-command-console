import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalIntegrityInput(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  const errors: ProposalIntegrityError[] = [];
  if (!input.proposalId || !input.proposalType || !input.title || !input.summary) {
    errors.push({
      code: "PROPOSAL_SCHEMA_INVALID",
      message: "Proposal identity and summary fields are required.",
      path: "proposal",
    });
  }
  if (input.scopeBoundaries.length === 0) {
    errors.push({
      code: "PROPOSAL_SCHEMA_INVALID",
      message: "At least one scope boundary is required.",
      path: "scopeBoundaries",
    });
  }
  return Object.freeze(errors);
}
