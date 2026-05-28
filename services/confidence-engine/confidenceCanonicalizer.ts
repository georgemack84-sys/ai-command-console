import {
  canonicalizeProposalReplayToString,
  canonicalizeProposalReplayValue,
} from "@/services/proposal-replay/replayCanonicalizer";

export function canonicalizeConfidenceValue<T>(value: T): T {
  return canonicalizeProposalReplayValue(value);
}

export function canonicalizeConfidenceToString(value: unknown): string {
  return canonicalizeProposalReplayToString(value);
}
