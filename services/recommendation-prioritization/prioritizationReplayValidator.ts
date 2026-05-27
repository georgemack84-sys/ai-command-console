import { bindPrioritizationReplay } from "./prioritizationReplayBinder";
import { rankRecommendationForVisibility } from "./recommendationRankingEngine";
import type { PrioritizationError, RecommendationPriorityInput, RecommendationPriority, PrioritizationReplayRecord } from "./types/prioritizationTypes";

export function validatePrioritizationReplay(args: {
  input: RecommendationPriorityInput;
  priority: RecommendationPriority;
  replayRecord: PrioritizationReplayRecord;
  versions: { weightingVersion: string; orderingVersion: string };
}): PrioritizationError[] {
  const reboundPriority = rankRecommendationForVisibility(args.input);
  const reboundReplay = bindPrioritizationReplay(args.input, reboundPriority, args.versions);
  const errors: PrioritizationError[] = [];

  if (reboundPriority.priorityScore !== args.priority.priorityScore
    || reboundPriority.priorityTier !== args.priority.priorityTier
    || reboundPriority.status !== args.priority.status
    || reboundPriority.prioritizationHash !== args.priority.prioritizationHash) {
    errors.push({
      code: "PRIORITIZATION_REPLAY_MISMATCH",
      message: "Prioritization replay reconstruction did not match the original score or tier.",
      path: `priority.${args.input.recommendationId}`,
    });
  }

  if (reboundReplay.replayRecordHash !== args.replayRecord.replayRecordHash) {
    errors.push({
      code: "PRIORITIZATION_REPLAY_MISMATCH",
      message: "Prioritization replay record drift was detected.",
      path: `replay.${args.input.recommendationId}`,
    });
  }

  return errors;
}
