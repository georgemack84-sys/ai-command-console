import type { Recommendation } from "@/services/recommendation-synthesis/types/recommendationSynthesisTypes";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { RecommendationSanitizationRecord } from "./types/recommendationConstraintTypes";

const SANITIZATION_RULES = Object.freeze([
  { from: /\bexecute\b/gi, to: "review" },
  { from: /\binvoke\b/gi, to: "consider" },
  { from: /\bdispatch\b/gi, to: "route for review" },
  { from: /\bschedule\b/gi, to: "plan for review" },
  { from: /\bretry\b/gi, to: "reconsider" },
  { from: /\bmutate\b/gi, to: "re-evaluate" },
  { from: /\borchestrate\b/gi, to: "coordinate for oversight" },
]);

function sanitizeText(value: string): string {
  return SANITIZATION_RULES.reduce(
    (current, rule) => current.replace(rule.from, rule.to),
    value,
  );
}

export function sanitizeRecommendation(input: {
  recommendation: Recommendation;
}): {
  recommendation: Recommendation;
  record: RecommendationSanitizationRecord;
} {
  const sanitizedSummary = sanitizeText(input.recommendation.summary);
  const sanitizedRationale = sanitizeText(input.recommendation.rationale);
  const sanitized = sanitizedSummary !== input.recommendation.summary
    || sanitizedRationale !== input.recommendation.rationale;
  const recommendation = Object.freeze({
    ...input.recommendation,
    summary: sanitizedSummary,
    rationale: sanitizedRationale,
    executionAuthorized: false as const,
  });
  const record = Object.freeze({
    recommendationId: input.recommendation.recommendationId,
    sanitizedSummary,
    sanitizedRationale,
    sanitized,
    sanitizationHash: hashRecommendationValue("recommendation-constraint-sanitization", {
      recommendationId: input.recommendation.recommendationId,
      sanitizedSummary,
      sanitizedRationale,
    }),
  } satisfies RecommendationSanitizationRecord);
  return { recommendation, record };
}
