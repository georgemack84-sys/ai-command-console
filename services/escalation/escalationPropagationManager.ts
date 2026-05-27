import type { FreezeRecommendationPropagation, PauseRecommendationPropagation } from "@/types/escalation";
import { coordinateFreezePropagation } from "@/services/freeze/freezePropagationCoordinator";
import { buildBoundedPauseRecommendation } from "@/services/pause/boundedPauseManager";

export function propagateEscalationRecommendations(input: {
  coordinationId: string;
  freezeRecommended: boolean;
  pauseRecommended: boolean;
  reasonCodes: readonly string[];
  createdAt: string;
}): Readonly<{
  freezePropagation: FreezeRecommendationPropagation;
  pausePropagation: PauseRecommendationPropagation;
}> {
  return Object.freeze({
    freezePropagation: coordinateFreezePropagation({
      coordinationId: input.coordinationId,
      frozen: input.freezeRecommended,
      replayUnsafe: input.freezeRecommended,
      reasonCodes: input.reasonCodes,
      createdAt: input.createdAt,
    }),
    pausePropagation: buildBoundedPauseRecommendation({
      coordinationId: input.coordinationId,
      restricted: input.pauseRecommended,
      reasonCodes: input.reasonCodes,
      createdAt: input.createdAt,
    }),
  });
}
