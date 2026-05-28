import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceFactor, ConfidenceScoringInput } from "./types/confidenceScoringTypes";

export function evaluateEvidenceQuality(
  input: ConfidenceScoringInput,
): ConfidenceFactor {
  const evidenceCount = input.evidenceAggregationResult.evidenceReferences.length;
  const conflictCount = input.evidenceAggregationResult.conflicts.length;
  const score = Math.max(0, Math.min(1, Number((conflictCount === 0 ? Math.min(1, evidenceCount / 5) : 0.2).toFixed(3))));
  return Object.freeze({
    factorId: `${input.confidenceSessionId}:evidence-quality`,
    factorType: "evidence_quality",
    score,
    weight: 0,
    reason: conflictCount === 0 ? "Evidence aggregation is conflict-free." : "Evidence conflicts reduce confidence and increase caution.",
    deterministicHash: hashRecommendationValue("confidence-scoring-evidence-quality", {
      evidenceCount,
      conflictCount,
      score,
    }),
  });
}
