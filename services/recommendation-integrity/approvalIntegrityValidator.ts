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

export function validateApprovalIntegrity(input: RecommendationIntegrityInput): {
  approvalSafe: boolean;
  errors: readonly RecommendationIntegrityError[];
  violations: readonly RecommendationViolation[];
  weaknesses: readonly RecommendationWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const approvalSafe = !serialized.includes("approvalomission") && !serialized.includes("approvalinheritance");
  if (approvalSafe) {
    return Object.freeze({
      approvalSafe: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  return Object.freeze({
    approvalSafe: false,
    errors: Object.freeze([
      error(
        "RECOMMENDATION_APPROVAL_OMISSION",
        "Recommendation approval support was omitted or inherited improperly.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashRecommendationIntegrityValue("approval-violation-id", input.recommendationId),
        recommendationId: input.recommendationId,
        coordinationId: input.attackResult.record.coordinationId,
        domain: "approval",
        severity: "high",
        createdAt: input.createdAt,
        deterministicHash: hashRecommendationIntegrityValue("approval-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("approval-weakness-id", input.recommendationId),
        recommendationId: input.recommendationId,
        classification: "RECOMMENDATION_APPROVAL_RISK",
        severity: "HIGH",
        rationale: "Approval dependencies were not explicit and immutable.",
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("approval-weakness", serialized),
      }),
    ]),
  });
}
