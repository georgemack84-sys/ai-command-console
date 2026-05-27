import type { ProposalIntegrityInput } from "./proposalIntegrityStateTypes";
import { validateProposalIntegrityInput } from "./proposalIntegritySchemas";

export function validateProposalSchema(input: ProposalIntegrityInput) {
  return validateProposalIntegrityInput(input);
}
