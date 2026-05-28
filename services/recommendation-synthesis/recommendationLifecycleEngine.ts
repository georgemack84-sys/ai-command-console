import { buildRecommendationLifecycleStateMachine } from "./recommendationLifecycleStateMachine";

export function validateRecommendationLifecycle(): boolean {
  return buildRecommendationLifecycleStateMachine().states.length > 0;
}
