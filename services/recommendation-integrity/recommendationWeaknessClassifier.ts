import type {
  RecommendationIntegrityError,
  RecommendationIntegrityInput,
  RecommendationWeakness,
} from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "./deterministicRecommendationHasher";

export function classifyRecommendationWeaknesses(input: {
  recommendationInput: RecommendationIntegrityInput;
  errors: readonly RecommendationIntegrityError[];
  inheritedWeaknesses: readonly RecommendationWeakness[];
}): readonly RecommendationWeakness[] {
  const generated: RecommendationWeakness[] = [];
  for (const item of input.errors) {
    if (item.code.includes("AUTHORITY")) {
      generated.push(Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("authority-weakness-id", item),
        recommendationId: input.recommendationInput.recommendationId,
        classification: "RECOMMENDATION_AUTHORITY_DRIFT_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: item.message,
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("authority-weakness", item),
      }));
      continue;
    }
    if (item.code.includes("ISOLATION") || item.code.includes("RUNTIME")) {
      generated.push(Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("isolation-weakness-id", item),
        recommendationId: input.recommendationInput.recommendationId,
        classification: "RECOMMENDATION_ISOLATION_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: item.message,
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("isolation-weakness", item),
      }));
      continue;
    }
    if (item.code.includes("ORCHESTRATION") || item.code.includes("RECURSIVE")) {
      generated.push(Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("orchestration-weakness-id", item),
        recommendationId: input.recommendationInput.recommendationId,
        classification: "RECOMMENDATION_HIDDEN_ORCHESTRATION_RISK",
        severity: "CRITICAL",
        rationale: item.message,
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("orchestration-weakness", item),
      }));
      continue;
    }
    if (item.code.includes("REPLAY")) {
      generated.push(Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("replay-weakness-id", item),
        recommendationId: input.recommendationInput.recommendationId,
        classification: "RECOMMENDATION_REPLAY_RISK",
        severity: "CRITICAL",
        rationale: item.message,
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("replay-weakness", item),
      }));
    }
  }
  return Object.freeze(
    [...input.inheritedWeaknesses, ...generated].sort((left, right) =>
      left.deterministicHash.localeCompare(right.deterministicHash),
    ),
  );
}
