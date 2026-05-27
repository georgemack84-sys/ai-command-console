import type { EscalationError, PauseRecommendationPropagation } from "@/types/escalation";
import { createEscalationError } from "@/services/escalation/escalationBoundaryEnforcer";

export function validatePauseContainment(recommendation: PauseRecommendationPropagation): readonly EscalationError[] {
  return Object.freeze(
    recommendation.visibilityOnly && recommendation.runtimeControl === false
      ? []
      : [createEscalationError(
        "ESCALATION_PAUSE_RESUME_FORBIDDEN",
        "Pause propagation must remain visibility-only and never control runtime state.",
        "pauseRecommendation",
      )],
  );
}
