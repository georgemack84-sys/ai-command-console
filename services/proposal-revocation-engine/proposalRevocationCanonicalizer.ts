import { canonicalizeReplayToString, canonicalizeReplayValue } from "@/services/recommendation-replay/replayCanonicalizer";

export function canonicalizeProposalRevocationValue<T>(value: T): T {
  return canonicalizeReplayValue(value);
}

export function canonicalizeProposalRevocationToString(value: unknown): string {
  return canonicalizeReplayToString(value);
}
