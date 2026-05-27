import type { FreezeRecommendationPropagation } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "@/services/escalation/escalationHasher";

export function buildFreezeRecommendation(input: {
  coordinationId: string;
  freezeRecommended: boolean;
  reasonCodes: readonly string[];
  createdAt: string;
}): FreezeRecommendationPropagation {
  return Object.freeze({
    recommendationId: hashEscalationCoordinationValue("freeze-recommendation-id", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    freezeRecommended: input.freezeRecommended,
    terminalContainmentOnly: true,
    visibilityOnly: true,
    reasonCodes: Object.freeze(input.reasonCodes),
    createdAt: input.createdAt,
  });
}
