import type { PauseRecommendationPropagation } from "@/types/escalation";
import { buildPausePropagation } from "./pausePropagationModel";

export function buildBoundedPauseRecommendation(input: {
  coordinationId: string;
  restricted: boolean;
  reasonCodes: readonly string[];
  createdAt: string;
}): PauseRecommendationPropagation {
  return buildPausePropagation({
    coordinationId: input.coordinationId,
    pauseRecommended: input.restricted,
    reasonCodes: input.reasonCodes,
    createdAt: input.createdAt,
  });
}
