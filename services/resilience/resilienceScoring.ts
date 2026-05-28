import { clampMetric } from "../stability/stabilityMetrics";
import { ConstitutionalResilienceState, type ConstitutionalResilienceAssessment } from "./resilienceTypes";

export function scoreResilienceState(input: Omit<ConstitutionalResilienceAssessment, "resilienceState">): ConstitutionalResilienceAssessment {
  let resilienceState = ConstitutionalResilienceState.STABLE;

  if (input.requiresFreeze) resilienceState = ConstitutionalResilienceState.CONSTITUTIONALLY_FROZEN;
  else if (input.disputedConditions.length > 0) resilienceState = ConstitutionalResilienceState.SURVIVABILITY_DISPUTED;
  else if (input.requiresContainment) resilienceState = ConstitutionalResilienceState.CONTAINED;
  else if (input.collapseProbability >= 0.82) resilienceState = ConstitutionalResilienceState.COLLAPSING;
  else if (input.operationalRiskScore >= 0.72) resilienceState = ConstitutionalResilienceState.CRITICAL;
  else if (input.operationalRiskScore >= 0.58) resilienceState = ConstitutionalResilienceState.UNSTABLE;
  else if (input.operationalRiskScore >= 0.45) resilienceState = ConstitutionalResilienceState.STRESSED;
  else if (input.operationalRiskScore >= 0.32) resilienceState = ConstitutionalResilienceState.DEGRADED;
  else if (input.survivabilityScore >= 0.85 && input.constitutionalIntegrityScore >= 0.85) resilienceState = ConstitutionalResilienceState.VERIFIED;

  return {
    ...input,
    resilienceState,
    survivabilityScore: clampMetric(input.survivabilityScore, 0.1),
    constitutionalIntegrityScore: clampMetric(input.constitutionalIntegrityScore, 0.1),
    operationalRiskScore: clampMetric(input.operationalRiskScore, 0.1),
    collapseProbability: clampMetric(input.collapseProbability, 0.1),
    degradationVelocity: clampMetric(input.degradationVelocity, 0.1),
    governanceIntegrity: clampMetric(input.governanceIntegrity, 0.1),
    continuityIntegrity: clampMetric(input.continuityIntegrity, 0.1),
    escalationPressure: clampMetric(input.escalationPressure, 0.1),
    stabilizationConfidence: clampMetric(input.stabilizationConfidence, 0.1),
  };
}
