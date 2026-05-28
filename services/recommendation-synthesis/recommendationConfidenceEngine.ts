import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationConfidenceRecord,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

function roundConfidence(value: number): number {
  return Number(value.toFixed(3));
}

export function deriveRecommendationConfidence(
  input: RecommendationSynthesisInput,
): RecommendationConfidenceRecord {
  const factors = Object.freeze([
    input.decisionReadinessCertificationResult.certification.replayDeterminismVerified ? "replay_determinism_verified" : "replay_determinism_unverified",
    input.decisionReadinessCertificationResult.certification.governanceLineageVerified ? "governance_lineage_verified" : "governance_lineage_unverified",
    input.recommendationValidationResult.result.containmentValidated ? "containment_validated" : "containment_unvalidated",
    input.hiddenExecutionDetectionResult.report.blocked ? "hidden_execution_blocked" : "hidden_execution_clear",
    input.operatorAuthorityResult.action.actionType.toLowerCase(),
  ]);

  const rawScore =
    0.35 +
    (input.deterministicReplayResult.result.replayCertified ? 0.2 : 0) +
    (input.decisionReadinessCertificationResult.certification.governanceLineageVerified ? 0.15 : 0) +
    (input.decisionReadinessCertificationResult.certification.proposalLineageVerified ? 0.1 : 0) +
    (input.recommendationValidationResult.result.containmentValidated ? 0.1 : 0) +
    (!input.hiddenExecutionDetectionResult.report.blocked ? 0.05 : -0.2);

  const confidenceScore = Math.max(0, Math.min(1, roundConfidence(rawScore)));
  return Object.freeze({
    confidenceId: `${input.synthesisId}:confidence`,
    confidenceScore,
    confidenceFactors: factors,
    confidenceHash: hashRecommendationValue("recommendation-synthesis-confidence", {
      confidenceScore,
      factors,
    }),
  });
}
