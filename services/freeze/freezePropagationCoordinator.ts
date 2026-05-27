import type { FreezeRecommendationPropagation } from "@/types/escalation";
import { buildFreezeRecommendation } from "./freezeRecommendationEngine";

export function coordinateFreezePropagation(input: {
  coordinationId: string;
  frozen: boolean;
  replayUnsafe: boolean;
  reasonCodes: readonly string[];
  createdAt: string;
}): FreezeRecommendationPropagation {
  return buildFreezeRecommendation({
    coordinationId: input.coordinationId,
    freezeRecommended: input.frozen || input.replayUnsafe,
    reasonCodes: input.reasonCodes,
    createdAt: input.createdAt,
  });
}
