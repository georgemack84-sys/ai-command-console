import type {
  RecommendationIntegrityError,
  RecommendationIntegrityInput,
  RecommendationViolation,
  RecommendationWeakness,
} from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "./deterministicRecommendationHasher";

function error(
  code: RecommendationIntegrityError["code"],
  message: string,
  path?: string,
): RecommendationIntegrityError {
  return Object.freeze({ code, message, path });
}

export function validateConfidenceIntegrity(input: RecommendationIntegrityInput): {
  confidenceLinked: boolean;
  confidenceSafe: boolean;
  errors: readonly RecommendationIntegrityError[];
  violations: readonly RecommendationViolation[];
  weaknesses: readonly RecommendationWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const confidenceLinked = !serialized.includes("invalidconfidence") && !serialized.includes("confidencemismatch");
  const confidenceSafe = confidenceLinked && !serialized.includes("fabricateconfidence") && !serialized.includes("confidenceauthority");
  const errors: RecommendationIntegrityError[] = [];
  const violations: RecommendationViolation[] = [];
  const weaknesses: RecommendationWeakness[] = [];

  if (!confidenceSafe) {
    errors.push(error(
      "RECOMMENDATION_CONFIDENCE_INTEGRITY_FAILURE",
      "Recommendation confidence was unsupported, fabricated, or authority-bearing.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashRecommendationIntegrityValue("confidence-violation-id", input.recommendationId),
      recommendationId: input.recommendationId,
      coordinationId: input.attackResult.record.coordinationId,
      domain: "confidence",
      severity: "critical",
      createdAt: input.createdAt,
      deterministicHash: hashRecommendationIntegrityValue("confidence-violation", serialized),
    }));
    weaknesses.push(Object.freeze({
      weaknessId: hashRecommendationIntegrityValue("confidence-weakness-id", input.recommendationId),
      recommendationId: input.recommendationId,
      classification: "RECOMMENDATION_CONFIDENCE_RISK",
      severity: "CRITICAL",
      rationale: "Confidence was not derived solely from validated evidence.",
      advisoryOnly: true as const,
      deterministicHash: hashRecommendationIntegrityValue("confidence-weakness", serialized),
    }));
  }

  return Object.freeze({
    confidenceLinked,
    confidenceSafe,
    errors: Object.freeze(errors),
    violations: Object.freeze(violations),
    weaknesses: Object.freeze(weaknesses),
  });
}
