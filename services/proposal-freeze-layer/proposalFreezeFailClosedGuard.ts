import { hashProposalFreezeValue } from "./proposalFreezeHasher";
import type {
  ProposalFreezeError,
  ProposalFreezeState,
} from "./types/proposalFreezeTypes";

export function resolveProposalFreezeState(input: {
  errors: readonly ProposalFreezeError[];
  existingFreezeState?: ProposalFreezeState;
  permanentFreezeRequired: boolean;
}): ProposalFreezeState {
  if (input.existingFreezeState === "PERMANENTLY_FROZEN" || input.permanentFreezeRequired) {
    return "PERMANENTLY_FROZEN";
  }
  if (input.existingFreezeState === "FROZEN" || input.errors.length > 0) {
    return "FROZEN";
  }
  return "ACTIVE";
}

export function buildProposalFreezeFailClosedHash(errors: readonly ProposalFreezeError[]): string {
  return hashProposalFreezeValue("proposal-freeze-fail-closed", errors.map((error) => error.code));
}
