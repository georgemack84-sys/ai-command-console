import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

export function analyzeRecommendationDrift(input: GovernanceDriftInput): Readonly<{
  recommendationLinked: boolean;
  errors: readonly GovernanceDriftError[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = markers.includes("advisorydivergence")
    || markers.includes("unsupportedrecommendationevolution")
    || markers.includes("governancedetachedrecommendation")
    || markers.includes("replayinconsistentrecommendation")
    || markers.includes("advisorylineagecorruption");
  if (!drift) {
    return Object.freeze({
      recommendationLinked: true,
      errors: Object.freeze([]),
    });
  }
  return Object.freeze({
    recommendationLinked: false,
    errors: Object.freeze([Object.freeze({
      code: "GOVERNANCE_DRIFT_RECOMMENDATION_DIVERGENCE" as const,
      message: "Recommendation drift detached from governance or replay-safe lineage was detected.",
      path: "metadata",
    })]),
  });
}
