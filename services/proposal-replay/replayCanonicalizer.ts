import { canonicalizeReplayToString, canonicalizeReplayValue } from "@/services/recommendation-replay/replayCanonicalizer";

export function canonicalizeProposalReplayValue<T>(value: T): T {
  return canonicalizeReplayValue(value);
}

export function canonicalizeProposalReplayToString(value: unknown): string {
  return canonicalizeReplayToString(value);
}
