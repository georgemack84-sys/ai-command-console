import { canonicalizeProposalTransitionToString } from "./proposalTransitionCanonicalizer";
import { hashProposalTransitionValue } from "./proposalTransitionHasher";
import {
  serializeGovernanceBindingRecord,
  serializeProposalLifecycleLineage,
  serializeProposalTransitionDeclaration,
  serializeProposalTransitionResult,
} from "./proposalTransitionSerializer";
import type {
  GovernanceBindingRecord,
  ProposalLifecycleLineage,
  ProposalStateError,
  ProposalTransitionDeclaration,
  ProposalTransitionResult,
} from "./types/proposalStateTypes";

export function validateProposalStateDeterminism(input: {
  transition: ProposalTransitionDeclaration;
  result: ProposalTransitionResult;
  lineage: ProposalLifecycleLineage;
  governanceBinding: GovernanceBindingRecord;
}): readonly ProposalStateError[] {
  const stable =
    serializeProposalTransitionDeclaration(input.transition) === canonicalizeProposalTransitionToString(input.transition)
    && serializeProposalTransitionResult(input.result) === canonicalizeProposalTransitionToString(input.result)
    && serializeProposalLifecycleLineage(input.lineage) === canonicalizeProposalTransitionToString(input.lineage)
    && serializeGovernanceBindingRecord(input.governanceBinding) === canonicalizeProposalTransitionToString(input.governanceBinding);

  if (!stable) {
    return Object.freeze([{
      code: "PROPOSAL_STATE_AMBIGUOUS_TRANSITION" as const,
      message: "Proposal state serialization drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  const canonicalString = canonicalizeProposalTransitionToString(input);
  const hashA = hashProposalTransitionValue("proposal-state-determinism", canonicalString);
  const hashB = hashProposalTransitionValue(
    "proposal-state-determinism",
    canonicalizeProposalTransitionToString(JSON.parse(canonicalString)),
  );
  if (hashA !== hashB) {
    return Object.freeze([{
      code: "PROPOSAL_STATE_AMBIGUOUS_TRANSITION" as const,
      message: "Proposal state hashing drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  return Object.freeze([]);
}
