import type { RecommendationReplayInput, RecommendationReplayEpisode } from "./types/recommendationReplayTypes";

export function reconstructConstraintReplay(
  input: RecommendationReplayInput,
): RecommendationReplayEpisode["constraintReplay"] {
  const scope = input.recommendationConstraintResult.scopeRecords.find((item) => item.recommendationId === input.recommendationId);
  const authority = input.recommendationConstraintResult.authorityRecords.find((item) => item.recommendationId === input.recommendationId);
  const constrained = input.recommendationConstraintResult.constrainedRecommendations.find((item) => item.constrainedRecommendation.recommendationId === input.recommendationId);

  return {
    scopeCeiling: scope?.scopeCeilingRespected ? "scope_ceiling_respected" : "scope_ceiling_breached",
    escalationCeiling: scope?.escalationCeilingRespected ? "escalation_ceiling_respected" : "escalation_ceiling_breached",
    authorityRestrictions: [
      authority?.operatorSupremacyPreserved ? "operator_supremacy_preserved" : "operator_supremacy_unstable",
      authority?.authorityExpansionDetected ? "authority_expansion_detected" : "authority_expansion_blocked",
      constrained?.sanitizationRecord.sanitized ? "sanitization_applied" : "sanitization_not_needed",
    ],
  };
}
