import { clampMetric } from "../stability/stabilityMetrics";
import type { OperationalStabilityAssessment } from "../stability/operationalStabilityEngine";

export function analyzeSurvivabilityPriority(stability?: OperationalStabilityAssessment | null) {
  const survivabilityImpact = clampMetric(
    1 - (stability?.survivabilityScore ?? 0.4) + (stability?.lockdownRecommended ? 0.2 : 0),
    1,
  );
  const survivabilityPriorityRequired = survivabilityImpact >= 0.65;

  return {
    survivabilityImpact,
    survivabilityPriorityRequired,
    reasons: [
      ...(stability?.lockdownRecommended ? ["lockdown_recommended"] : []),
      ...(stability?.containmentRecommended ? ["containment_recommended"] : []),
      ...(stability?.stabilizationRequired ? ["stabilization_required"] : []),
    ],
  };
}
