import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { validateAdvisoryOnly } from "./advisoryOnlyValidator";
import { bindRecommendationGovernance } from "./recommendationGovernanceBinder";
import { validateRecommendationReplay } from "./recommendationReplayValidator";
import { validateRecommendationContainment } from "./recommendationContainmentValidator";

export function certifyRecommendationIntegrity(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...validateAdvisoryOnly(input),
    ...bindRecommendationGovernance(input),
    ...validateRecommendationReplay(input),
    ...validateRecommendationContainment(input),
  ]);
  return buildGateDomainCertification({
    domain: "recommendation",
    errors,
    disputed: errors.some((item) => item.code.includes("REPLAY")),
  });
}
