import { auditRecommendationReplay } from "@/services/recommendation-synthesis/recommendationReplayAuditor";
import type { EvidenceAggregationError, EvidenceAggregationInput } from "./types/evidenceAggregationTypes";

export function validateEvidenceReplay(
  input: EvidenceAggregationInput,
): readonly EvidenceAggregationError[] {
  const replayErrors = auditRecommendationReplay(input.recommendationSynthesisInput);
  return Object.freeze(
    replayErrors.map((error) => ({
      code: "EVIDENCE_AGGREGATION_REPLAY_RECONSTRUCTION_MISMATCH" as const,
      message: error.message,
      path: error.path,
    })),
  );
}
