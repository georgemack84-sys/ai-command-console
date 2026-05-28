import { canonicalizeProposalTransitionToString } from "./proposalTransitionCanonicalizer";
import type {
  GovernanceBindingRecord,
  ProposalLifecycleLineage,
  ProposalTransitionDeclaration,
  ProposalTransitionResult,
} from "./types/proposalStateTypes";

export function serializeProposalTransitionDeclaration(value: ProposalTransitionDeclaration): string {
  return canonicalizeProposalTransitionToString(value);
}

export function serializeProposalTransitionResult(value: ProposalTransitionResult): string {
  return canonicalizeProposalTransitionToString(value);
}

export function serializeProposalLifecycleLineage(value: ProposalLifecycleLineage): string {
  return canonicalizeProposalTransitionToString(value);
}

export function serializeGovernanceBindingRecord(value: GovernanceBindingRecord): string {
  return canonicalizeProposalTransitionToString(value);
}
