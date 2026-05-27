import type { GovernanceRecommendation } from "./governanceRecommendations";
import type { OperationalSovereigntyAssessment } from "../sovereignty/operationalSovereigntyEngine";

const UNSAFE_PATTERNS = [
  "auto-apply",
  "rewrite constitutional",
  "alter immutable truth",
  "suppress audit",
  "bypass approval",
  "disable containment",
  "expand autonomy",
];

export function validateGovernanceConstraints(input: {
  recommendations: GovernanceRecommendation[];
  sovereigntyAssessment?: OperationalSovereigntyAssessment;
  constitutionalContext: {
    immutableTruthAffected: boolean;
    approvalRequired: boolean;
    escalationRequired: boolean;
    disputedStatePresent: boolean;
  };
}) {
  const blockedRecommendations: string[] = [];
  const allowedRecommendations: GovernanceRecommendation[] = [];

  for (const recommendation of input.recommendations) {
    const lowered = `${recommendation.category} ${recommendation.recommendation}`.toLowerCase();
    const hasUnsafePattern = UNSAFE_PATTERNS.some((pattern) => lowered.includes(pattern));
    const collapsing =
      input.sovereigntyAssessment?.sovereigntyState === "COLLAPSING"
      || input.sovereigntyAssessment?.sovereigntyState === "EMERGENCY_CONTAINMENT";
    const weakensCriticalContainment =
      lowered.includes("reduce escalation")
      && ["CRITICAL", "COLLAPSING", "EMERGENCY_CONTAINMENT"].includes(input.sovereigntyAssessment?.sovereigntyState ?? "");

    if (hasUnsafePattern) {
      blockedRecommendations.push(recommendation.recommendationId);
      continue;
    }
    if (input.constitutionalContext.immutableTruthAffected) {
      blockedRecommendations.push(recommendation.recommendationId);
      continue;
    }
    if (input.constitutionalContext.disputedStatePresent && recommendation.category === "POLICY_ADJUSTMENT") {
      blockedRecommendations.push(recommendation.recommendationId);
      continue;
    }
    if (collapsing && !["STABILIZATION_STRATEGY", "EMERGENCY_CONTAINMENT_REVIEW"].includes(recommendation.category)) {
      blockedRecommendations.push(recommendation.recommendationId);
      continue;
    }
    if (input.sovereigntyAssessment?.sovereigntyState === "CONTAINMENT_ACTIVE" && recommendation.category === "POLICY_ADJUSTMENT") {
      blockedRecommendations.push(recommendation.recommendationId);
      continue;
    }
    if (weakensCriticalContainment) {
      blockedRecommendations.push(recommendation.recommendationId);
      continue;
    }

    allowedRecommendations.push(recommendation);
  }

  return {
    allowedRecommendations,
    blockedRecommendations,
  };
}
