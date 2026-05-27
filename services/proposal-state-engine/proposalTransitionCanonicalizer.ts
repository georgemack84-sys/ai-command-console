import {
  canonicalizeReplayToString,
  canonicalizeReplayValue,
} from "@/services/recommendation-replay/replayCanonicalizer";

export function canonicalizeProposalTransitionValue<T>(value: T): T {
  return canonicalizeReplayValue(value);
}

export function canonicalizeProposalTransitionToString(value: unknown): string {
  return canonicalizeReplayToString(value);
}
