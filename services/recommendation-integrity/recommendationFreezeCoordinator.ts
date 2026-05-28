import type { RecommendationIntegrityError, RecommendationIntegrityState } from "@/types/recommendation-integrity";

export function resolveRecommendationIntegrityState(input: {
  errors: readonly RecommendationIntegrityError[];
  governanceLinked: boolean;
  replayDeterministic: boolean;
  inheritedFailClosed: boolean;
}): RecommendationIntegrityState {
  if (input.inheritedFailClosed || input.errors.length > 0) {
    return "FAIL_CLOSED";
  }
  if (!input.governanceLinked || !input.replayDeterministic) {
    return "CONDITIONALLY_BLOCKED";
  }
  return "SIMULATED";
}
