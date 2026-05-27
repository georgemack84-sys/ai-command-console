import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalBoundaries(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  const errors: ProposalIntegrityError[] = [];
  if (input.scopeBoundaries.some((boundary) => !boundary.immutable || !boundary.boundaryId || !boundary.domain)) {
    errors.push({
      code: "PROPOSAL_SCHEMA_INVALID",
      message: "Scope boundaries must be immutable and fully identified.",
      path: "scopeBoundaries",
    });
  }
  if (input.metadata?.scopeExpansion === true) {
    errors.push({
      code: "PROPOSAL_AUTHORITY_EXPANSION_DETECTED",
      message: "Scope expansion is forbidden in proposal integrity.",
      path: "metadata.scopeExpansion",
    });
  }
  return Object.freeze(errors);
}
