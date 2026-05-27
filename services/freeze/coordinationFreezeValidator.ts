import type { EscalationError, FreezeRecommendationPropagation } from "@/types/escalation";
import { createEscalationError } from "@/services/escalation/escalationBoundaryEnforcer";

export function validateCoordinationFreezeRecommendation(recommendation: FreezeRecommendationPropagation): readonly EscalationError[] {
  return Object.freeze(
    recommendation.visibilityOnly && recommendation.terminalContainmentOnly
      ? []
      : [createEscalationError(
        "ESCALATION_FREEZE_MISMATCH",
        "Freeze recommendation must remain visibility-only terminal containment evidence.",
        "freezeRecommendation",
      )],
  );
}
