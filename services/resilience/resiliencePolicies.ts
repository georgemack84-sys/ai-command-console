import { ConstitutionalResilienceState, type ConstitutionalResilienceAssessment } from "./resilienceTypes";

export function applyResiliencePolicies(assessment: ConstitutionalResilienceAssessment) {
  if (assessment.disputedConditions.length > 0) {
    return {
      ...assessment,
      resilienceState: ConstitutionalResilienceState.SURVIVABILITY_DISPUTED,
      requiresOperatorIntervention: true,
    };
  }
  if (assessment.requiresFreeze) {
    return {
      ...assessment,
      resilienceState: ConstitutionalResilienceState.CONSTITUTIONALLY_FROZEN,
      requiresOperatorIntervention: true,
    };
  }
  if (assessment.collapseProbability >= 0.82) {
    return {
      ...assessment,
      resilienceState: ConstitutionalResilienceState.COLLAPSING,
      requiresEscalation: true,
    };
  }
  return assessment;
}
