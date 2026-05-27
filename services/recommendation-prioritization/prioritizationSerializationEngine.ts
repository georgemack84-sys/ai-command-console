import { canonicalizeRecommendationToString } from "@/services/recommendation-synthesis/recommendationCanonicalizer";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type {
  RecommendationPriority,
  RecommendationPriorityInput,
  PrioritizationResult,
  PrioritizationSerializationRecord,
} from "./types/prioritizationTypes";

export function serializePrioritizationInput(input: RecommendationPriorityInput): string {
  return canonicalizeRecommendationToString(input);
}

export function serializePriority(priority: RecommendationPriority): PrioritizationSerializationRecord {
  const canonicalForm = canonicalizeRecommendationToString(priority);
  return Object.freeze({
    prioritizationId: priority.prioritizationId,
    canonicalForm,
    serializationHash: hashRecommendationValue("recommendation-prioritization-serialization", canonicalForm),
  });
}

export function serializePrioritizationResult(result: PrioritizationResult): string {
  return canonicalizeRecommendationToString(result);
}
