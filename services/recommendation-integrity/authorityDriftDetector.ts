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

export function detectAuthorityDrift(input: RecommendationIntegrityInput): {
  authorityDriftDetected: boolean;
  errors: readonly RecommendationIntegrityError[];
  violations: readonly RecommendationViolation[];
  weaknesses: readonly RecommendationWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const authorityDriftDetected =
    serialized.includes("authorityinheritance")
    || serialized.includes("implyexecution")
    || serialized.includes("implydispatch")
    || serialized.includes("dynamiccapability")
    || serialized.includes("escalationauthority");
  if (!authorityDriftDetected) {
    return Object.freeze({
      authorityDriftDetected: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  return Object.freeze({
    authorityDriftDetected: true,
    errors: Object.freeze([
      error(
        "RECOMMENDATION_AUTHORITY_DRIFT",
        "Recommendations implied authority, execution, dispatch, or escalation power.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashRecommendationIntegrityValue("authority-violation-id", input.recommendationId),
        recommendationId: input.recommendationId,
        coordinationId: input.attackResult.record.coordinationId,
        domain: "authority",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashRecommendationIntegrityValue("authority-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("authority-weakness-id", input.recommendationId),
        recommendationId: input.recommendationId,
        classification: "RECOMMENDATION_AUTHORITY_DRIFT_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: "Recommendations drifted toward operational authority.",
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("authority-weakness", serialized),
      }),
    ]),
  });
}
