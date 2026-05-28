import type {
  RecommendationLineageError,
  RecommendationLineageMetrics,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

function countErrors(
  errors: readonly RecommendationLineageError[],
  codes: readonly string[],
): number {
  return errors.filter((error) => codes.includes(error.code)).length;
}

export function aggregateRecommendationLineageMetrics(input: {
  errors: readonly RecommendationLineageError[];
  reconstructionTime: number;
}): RecommendationLineageMetrics {
  const metrics = Object.freeze({
    lineageIntegrityFailures: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_LINEAGE_MUTATION",
      "RECOMMENDATION_LINEAGE_SYNTHETIC_ANCESTRY",
    ]),
    replayDriftEvents: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_REPLAY_DRIFT",
    ]),
    governanceLineageMismatches: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_GOVERNANCE_GAP",
      "RECOMMENDATION_LINEAGE_GOVERNANCE_MISMATCH",
      "RECOMMENDATION_LINEAGE_GOVERNANCE_BINDING_INVALID",
    ]),
    approvalLineageConflicts: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_APPROVAL_AMBIGUOUS",
    ]),
    evidenceSnapshotFailures: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_EVIDENCE_GAP",
      "RECOMMENDATION_LINEAGE_EVIDENCE_DRIFT",
    ]),
    lineageReconstructionTime: input.reconstructionTime,
    lineageHashMismatches: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_LINEAGE_MUTATION",
    ]),
    policyLineageDivergence: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_POLICY_SUBSTITUTION",
    ]),
    confidenceLineageDrift: countErrors(input.errors, [
      "RECOMMENDATION_LINEAGE_SCORING_INCONSISTENT",
    ]),
    metricsHash: "",
  });
  return Object.freeze({
    ...metrics,
    metricsHash: hashRecommendationLineageValue("recommendation-lineage-metrics", metrics),
  });
}
