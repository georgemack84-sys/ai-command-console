import type { ConstitutionalReadinessInput, ReadinessError, RecommendationReadinessRecord } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";
import { hashReadinessValue } from "./readinessHashEngine";

export function validateRecommendationIntegrity(input: ConstitutionalReadinessInput): {
  record: RecommendationReadinessRecord;
  errors: readonly ReadinessError[];
} {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const anomalyRate = input.adversarialTelemetryResult.metrics.recommendation_anomaly_rate;
  const confidenceScore = input.adversarialTelemetryResult.metrics.confidence_volatility_score;
  const errors: ReadinessError[] = [];

  if (anomalyRate > 0 || confidenceScore > 0) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_RECOMMENDATION_INTEGRITY_FAILURE",
      message: "Recommendation anomalies or confidence volatility exceeded constitutional readiness limits.",
      path: "adversarialTelemetryResult.metrics.recommendation_anomaly_rate",
    }));
  }
  if (
    normalized.includes("fabricatedevidence")
    || normalized.includes("confidencespoofing")
    || normalized.includes("unsupportedrecommendation")
    || normalized.includes("recommendationsuppression")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_RECOMMENDATION_ADVISORY_DRIFT",
      message: "Fabricated evidence, confidence spoofing, unsupported recommendation, or recommendation suppression markers were detected.",
      path: "metadata",
    }));
  }

  const record: RecommendationReadinessRecord = Object.freeze({
    readinessId: input.readinessId,
    recommendationAnomalyRate: anomalyRate,
    confidenceVolatilityScore: confidenceScore,
    recommendationIntegrityStable: errors.length === 0,
    verificationHash: hashReadinessValue("constitutional-readiness-recommendation-record", {
      readinessId: input.readinessId,
      anomalyRate,
      confidenceScore,
      errors: errors.map((item) => item.code),
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
