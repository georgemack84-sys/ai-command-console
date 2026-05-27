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

export function detectEscalationSuppression(input: RecommendationIntegrityInput): {
  escalationSafe: boolean;
  errors: readonly RecommendationIntegrityError[];
  violations: readonly RecommendationViolation[];
  weaknesses: readonly RecommendationWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const escalationSafe = !serialized.includes("suppressescalation") && !serialized.includes("omitapproval") && !serialized.includes("escalationomission");
  if (escalationSafe) {
    return Object.freeze({
      escalationSafe: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  return Object.freeze({
    escalationSafe: false,
    errors: Object.freeze([
      error(
        "RECOMMENDATION_ESCALATION_SUPPRESSION",
        "Recommendation suppressed or omitted required escalation visibility.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashRecommendationIntegrityValue("escalation-violation-id", input.recommendationId),
        recommendationId: input.recommendationId,
        coordinationId: input.attackResult.record.coordinationId,
        domain: "escalation",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashRecommendationIntegrityValue("escalation-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("escalation-weakness-id", input.recommendationId),
        recommendationId: input.recommendationId,
        classification: "RECOMMENDATION_ESCALATION_RISK",
        severity: "HIGH",
        rationale: "Escalation visibility was suppressed instead of preserved.",
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("escalation-weakness", serialized),
      }),
    ]),
  });
}
