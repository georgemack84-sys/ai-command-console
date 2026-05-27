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

export function detectHiddenRecommendationOrchestration(input: RecommendationIntegrityInput): {
  hiddenOrchestrationDetected: boolean;
  errors: readonly RecommendationIntegrityError[];
  violations: readonly RecommendationViolation[];
  weaknesses: readonly RecommendationWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const hiddenOrchestrationDetected =
    serialized.includes("hiddenorchestration")
    || serialized.includes("recursiverecommendation")
    || serialized.includes("invisiblecontinuation")
    || serialized.includes("topologysynthesis");
  if (!hiddenOrchestrationDetected) {
    return Object.freeze({
      hiddenOrchestrationDetected: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  return Object.freeze({
    hiddenOrchestrationDetected: true,
    errors: Object.freeze([
      error(
        serialized.includes("recursiverecommendation")
          ? "RECOMMENDATION_RECURSIVE_ADVISORY_CHAIN"
          : "RECOMMENDATION_HIDDEN_ORCHESTRATION",
        "Hidden orchestration or recursive advisory chaining was detected.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashRecommendationIntegrityValue("orchestration-violation-id", input.recommendationId),
        recommendationId: input.recommendationId,
        coordinationId: input.attackResult.record.coordinationId,
        domain: "orchestration",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashRecommendationIntegrityValue("orchestration-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("orchestration-weakness-id", input.recommendationId),
        recommendationId: input.recommendationId,
        classification: "RECOMMENDATION_HIDDEN_ORCHESTRATION_RISK",
        severity: "CRITICAL",
        rationale: "Recommendation chains implied orchestration or recursive continuation.",
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("orchestration-weakness", serialized),
      }),
    ]),
  });
}
