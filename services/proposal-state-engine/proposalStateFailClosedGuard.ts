import { hashProposalTransitionValue } from "./proposalTransitionHasher";
import type {
  ProposalStateError,
  ProposalStateFreezeRecord,
} from "./types/proposalStateTypes";

export function buildProposalStateFreezeRecord(
  errors: readonly ProposalStateError[],
): ProposalStateFreezeRecord {
  const reasons = [...new Set(errors.map((error) => error.code))] as ProposalStateError["code"][];
  const frozen = reasons.includes("PROPOSAL_STATE_FROZEN")
    || reasons.includes("PROPOSAL_STATE_LINEAGE_DISPUTED");
  const failedClosed = reasons.length > 0;

  return Object.freeze({
    frozen,
    failedClosed,
    reasons,
    freezeHash: hashProposalTransitionValue("proposal-state-freeze", reasons),
  });
}
