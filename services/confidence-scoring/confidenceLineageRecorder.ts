import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type {
  ConfidenceLineage,
  ConfidenceLineageEntry,
  ConfidenceLineageLedger,
  ConfidenceScore,
  ConfidenceScoringInput,
} from "./types/confidenceScoringTypes";

export function buildConfidenceLineage(input: {
  scoringInput: ConfidenceScoringInput;
  score: ConfidenceScore;
}): ConfidenceLineage {
  const parentLineageRefs = Object.freeze([
    input.scoringInput.recommendationSynthesisResult.lineage.lineageHash,
    input.scoringInput.evidenceAggregationResult.lineage.lineageHash,
  ]);
  const evidenceRefs = Object.freeze(
    input.scoringInput.evidenceAggregationResult.evidenceReferences.map((reference) => reference.evidenceId),
  );
  return Object.freeze({
    lineageId: `${input.score.confidenceId}:lineage`,
    confidenceId: input.score.confidenceId,
    parentLineageRefs,
    evidenceRefs,
    lineageHash: hashRecommendationValue("confidence-scoring-lineage", {
      confidenceId: input.score.confidenceId,
      parentLineageRefs,
      evidenceRefs,
    }),
  });
}

export function appendConfidenceLineage(input: {
  existing?: ConfidenceLineageLedger;
  entries: readonly ConfidenceLineageEntry[];
}): ConfidenceLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), ...input.entries]);
  return Object.freeze({
    entries,
    lineageHash: hashRecommendationValue("confidence-scoring-lineage-ledger", entries),
  });
}
