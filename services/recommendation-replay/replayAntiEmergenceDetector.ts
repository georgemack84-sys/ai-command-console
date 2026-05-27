import type { RecommendationReplayEpisode, RecommendationReplayError } from "./types/recommendationReplayTypes";

export function detectReplayAntiEmergence(episode: RecommendationReplayEpisode): RecommendationReplayError[] {
  const errors: RecommendationReplayError[] = [];
  const containmentState = episode.governanceReplay.containmentState.toLowerCase();
  const escalationState = episode.governanceReplay.escalationState.toLowerCase();
  const restrictions = episode.constraintReplay.authorityRestrictions.map((item) => item.toLowerCase());

  if (containmentState.includes("hidden_execution_open")
    || containmentState.includes("orchestration_open")
    || containmentState.includes("scheduling_open")) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_HIDDEN_EXECUTION",
      message: "Replay reconstructed an unsafe containment state.",
      path: `episode.${episode.recommendationId}.governanceReplay.containmentState`,
    });
  }

  if (escalationState.includes("breached")) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_ANTI_EMERGENCE",
      message: "Replay reconstructed an escalation state that breaches constitutional ceilings.",
      path: `episode.${episode.recommendationId}.governanceReplay.escalationState`,
    });
  }

  if (restrictions.includes("authority_expansion_detected")) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_ANTI_EMERGENCE",
      message: "Replay detected authority expansion in reconstructed restrictions.",
      path: `episode.${episode.recommendationId}.constraintReplay.authorityRestrictions`,
    });
  }

  if (restrictions.includes("operator_supremacy_unstable")) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_OPERATOR_REVIEW_REQUIRED",
      message: "Replay detected unstable operator supremacy and must require heightened review.",
      path: `episode.${episode.recommendationId}.constraintReplay.authorityRestrictions`,
    });
  }

  if (episode.executionAuthorized !== false
    || episode.runtimeMutationOccurred !== false
    || episode.scheduledActionCreated !== false
    || episode.authorityChanged !== false
    || episode.operatorReviewRequired !== true) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_FAIL_CLOSED",
      message: "Replay hard constitutional flags were violated.",
      path: `episode.${episode.recommendationId}.flags`,
    });
  }

  return errors;
}
