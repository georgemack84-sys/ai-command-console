import { canonicalizeReplayToString, canonicalizeReplayValue } from "@/services/recommendation-replay/replayCanonicalizer";

export function canonicalizeGovernanceBindingValue<T>(value: T): T {
  return canonicalizeReplayValue(value);
}

export function canonicalizeGovernanceBindingToString(value: unknown): string {
  return canonicalizeReplayToString(value);
}
