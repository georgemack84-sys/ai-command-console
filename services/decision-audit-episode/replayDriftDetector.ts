import type { DecisionAuditEpisodeError, DecisionAuditEpisodeInput } from "./types/decisionAuditEpisodeTypes";

export function detectDecisionEpisodeReplayDrift(input: DecisionAuditEpisodeInput): readonly DecisionAuditEpisodeError[] {
  const errors: DecisionAuditEpisodeError[] = [];
  if (input.deterministicReplayResult.result.reconstructedRecommendationHash !== input.deterministicReplayResult.result.originalRecommendationHash) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_HASH_MISMATCH",
      message: "Reconstructed recommendation hash diverged from historical original hash.",
      path: "deterministicReplayResult.result.reconstructedRecommendationHash",
    });
  }
  if (!input.recommendationValidationResult.result.governanceValidated) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_REPLAY_MISMATCH",
      message: "Governance validation drift prevents episode trust.",
      path: "recommendationValidationResult.result.governanceValidated",
    });
  }
  if (input.metadata?.visibilityMismatch === true) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_VISIBILITY_MISMATCH",
      message: "Operator visibility mismatch detected during episode reconstruction.",
      path: "metadata",
    });
  }
  return Object.freeze(errors);
}
