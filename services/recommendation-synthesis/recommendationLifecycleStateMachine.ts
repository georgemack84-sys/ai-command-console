import { RECOMMENDATION_SYNTHESIS_LIFECYCLE } from "./recommendationSynthesisContracts";
import { hashRecommendationValue } from "./recommendationHashEngine";

export function buildRecommendationLifecycleStateMachine() {
  return Object.freeze({
    states: RECOMMENDATION_SYNTHESIS_LIFECYCLE,
    stateMachineHash: hashRecommendationValue(
      "recommendation-synthesis-state-machine",
      RECOMMENDATION_SYNTHESIS_LIFECYCLE,
    ),
  });
}
