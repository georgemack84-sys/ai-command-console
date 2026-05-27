import {
  canonicalizeReplayToString,
  canonicalizeReplayValue,
} from "@/services/recommendation-replay/replayCanonicalizer";

export function canonicalizeProposalFreezeValue<T>(value: T): T {
  return canonicalizeReplayValue(value);
}

export function canonicalizeProposalFreezeToString(value: unknown): string {
  return canonicalizeReplayToString(value);
}
