import { canonicalizeReplayToString, canonicalizeReplayValue } from "@/services/recommendation-replay/replayCanonicalizer";

export function canonicalizeRecommendationLedgerValue<T>(value: T): T {
  return canonicalizeReplayValue(value);
}

export function canonicalizeRecommendationLedgerToString(value: unknown): string {
  return canonicalizeReplayToString(value);
}
