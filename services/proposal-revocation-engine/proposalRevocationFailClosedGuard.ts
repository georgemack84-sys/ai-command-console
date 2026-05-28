import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import type { ProposalRevocationError, ProposalRevocationState } from "./proposalRevocationTypes";

export function resolveProposalRevocationState(input: {
  errors: readonly ProposalRevocationError[];
  cascadeComplete: boolean;
}): ProposalRevocationState {
  if (input.errors.length > 0) {
    return "FAILED_CLOSED";
  }
  return input.cascadeComplete ? "CASCADE_COMPLETED" : "CASCADE_IN_PROGRESS";
}

export function buildProposalRevocationFailClosedHash(errors: readonly ProposalRevocationError[]): string {
  return hashProposalRevocationValue("proposal-revocation-fail-closed", errors.map((error) => error.code));
}
