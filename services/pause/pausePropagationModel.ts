import type { PauseRecommendationPropagation } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "@/services/escalation/escalationHasher";

export function buildPausePropagation(input: {
  coordinationId: string;
  pauseRecommended: boolean;
  reasonCodes: readonly string[];
  createdAt: string;
}): PauseRecommendationPropagation {
  return Object.freeze({
    recommendationId: hashEscalationCoordinationValue("pause-propagation-id", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    pauseRecommended: input.pauseRecommended,
    visibilityOnly: true,
    runtimeControl: false,
    reasonCodes: Object.freeze(input.reasonCodes),
    createdAt: input.createdAt,
  });
}
