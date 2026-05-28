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

export function simulateRecommendationCorruption(input: RecommendationIntegrityInput): {
  corrupted: boolean;
  errors: readonly RecommendationIntegrityError[];
  violations: readonly RecommendationViolation[];
  weaknesses: readonly RecommendationWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const corrupted =
    serialized.includes("unsupportedrecommendation")
    || serialized.includes("fabricatedevidence")
    || serialized.includes("approvalomission");
  if (!corrupted) {
    return Object.freeze({
      corrupted: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }

  return Object.freeze({
    corrupted: true,
    errors: Object.freeze([
      error(
        serialized.includes("approvalomission")
          ? "RECOMMENDATION_APPROVAL_OMISSION"
          : "RECOMMENDATION_FABRICATED_EVIDENCE",
        "Recommendation corruption markers were detected.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashRecommendationIntegrityValue("corruption-violation-id", input.recommendationId),
        recommendationId: input.recommendationId,
        coordinationId: input.attackResult.record.coordinationId,
        domain: serialized.includes("approvalomission") ? "approval" : "evidence",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashRecommendationIntegrityValue("corruption-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("corruption-weakness-id", input.recommendationId),
        recommendationId: input.recommendationId,
        classification: serialized.includes("approvalomission")
          ? "RECOMMENDATION_APPROVAL_RISK"
          : "RECOMMENDATION_EVIDENCE_RISK",
        severity: "CRITICAL",
        rationale: "Recommendation evidence or approval support was not constitutionally intact.",
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("corruption-weakness", serialized),
      }),
    ]),
  });
}
