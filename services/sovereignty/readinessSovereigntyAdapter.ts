export function adaptReadinessToSovereignty(input: {
  readinessState: string;
  readinessConfidence: number;
  blockingRisks: string[];
  advisoryOnly: boolean;
  autonomyPromotionAllowed: boolean;
}) {
  return {
    constitutionalSafe:
      input.advisoryOnly
      && input.autonomyPromotionAllowed === false
      && input.blockingRisks.length === 0
      && !["GOVERNANCE_BLOCKED", "READINESS_CONFIDENCE_LOW", "OPERATOR_REVIEW_REQUIRED"].includes(input.readinessState),
    inheritedConstraints: Array.from(new Set([
      ...input.blockingRisks,
      ...(input.autonomyPromotionAllowed ? ["AUTONOMY_PROMOTION_PROHIBITED"] : []),
      ...(input.advisoryOnly ? [] : ["READINESS_NOT_ADVISORY_ONLY"]),
    ])).sort(),
    readinessConfidence: input.readinessConfidence,
    advisoryOnly: input.advisoryOnly,
  };
}
