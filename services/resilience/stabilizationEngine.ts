import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import type { StabilizationEvaluation } from "./resilienceTypes";
import { evaluateStabilizationPolicies } from "./stabilizationPolicies";
import { buildStabilizationRecommendations } from "./stabilizationRecommendations";

export function evaluateStabilization(dashboard: RecoveryDashboardReadModel): StabilizationEvaluation {
  const policies = evaluateStabilizationPolicies(dashboard);
  const recommendations = buildStabilizationRecommendations(dashboard);

  return {
    stabilizationConfidence: clampMetric(
      (dashboard.stewardship?.confidence ?? 0.35) * 0.45
        + (dashboard.operationalStabilityAssessment?.confidence ?? 0.35) * 0.35
        + (policies.stabilizationRequired ? 0.12 : 0.28),
      0.1,
    ),
    activeOperations: recommendations.filter((recommendation) => recommendation.startsWith("stabilize") || recommendation.startsWith("maintain")),
    recommendations,
  };
}
