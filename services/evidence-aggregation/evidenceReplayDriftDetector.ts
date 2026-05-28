import { detectRecommendationDrift } from "@/services/recommendation-synthesis/recommendationDriftDetector";
import type { EvidenceAggregationError, EvidenceAggregationInput } from "./types/evidenceAggregationTypes";

export function detectEvidenceReplayDrift(
  input: EvidenceAggregationInput,
): readonly EvidenceAggregationError[] {
  return Object.freeze(
    detectRecommendationDrift(input.recommendationSynthesisInput).map((error) => ({
      code: "EVIDENCE_AGGREGATION_REPLAY_DRIFT" as const,
      message: error.message,
      path: error.path,
    })),
  );
}
