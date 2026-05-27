import { detectGovernanceMismatch } from "./governanceMismatchDetector";
import type { ProposalFreezeInput } from "./types/proposalFreezeTypes";

export function validateProposalFreezeGovernance(input: ProposalFreezeInput) {
  return detectGovernanceMismatch(input);
}
