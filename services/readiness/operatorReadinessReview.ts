export function buildOperatorReadinessReview(input: {
  readinessState: string;
  blockingRisks: string[];
  warnings: string[];
}) {
  const requiresOperatorReview =
    input.readinessState !== "CONDITIONALLY_READY"
    || input.blockingRisks.length > 0
    || input.warnings.length > 0;

  return {
    requiresOperatorReview,
    recommendedActions: Array.from(new Set([
      ...(input.blockingRisks.length > 0 ? ["review_readiness_constraints"] : []),
      ...input.warnings.map((warning) => `review:${warning}`),
    ])),
  };
}
