import type {
  RecoveryPrioritizationAssessment,
  RecoveryPriorityCategory,
  RecoveryPriorityState,
} from "./prioritizationTypes";

function categoryForAssessment(assessment: RecoveryPrioritizationAssessment): RecoveryPriorityCategory {
  if (assessment.constitutionalRisk >= 0.8) return "CONSTITUTIONAL_CRITICAL";
  if (assessment.survivabilityImpact >= 0.8) return "SURVIVABILITY_CRITICAL";
  if (assessment.governanceRisk >= 0.75) return "GOVERNANCE_CRITICAL";
  if (1 - assessment.continuityStability >= 0.7) return "CONTINUITY_CRITICAL";
  if (assessment.dependencyImportance >= 0.75) return "DEPENDENCY_CRITICAL";
  if (assessment.operationalCriticality >= 0.75) return "OPERATIONAL_CRITICAL";
  if (assessment.tenantImpact >= 0.75) return "TENANT_CRITICAL";
  if (assessment.prioritizationScore <= 0.25) return "DEFERRED";
  return "STANDARD";
}

function stateForAssessment(assessment: RecoveryPrioritizationAssessment): RecoveryPriorityState {
  if (assessment.constitutionalRisk >= 0.85 && assessment.divergenceScore >= 0.7) return "FROZEN";
  if (assessment.governanceRisk >= 0.8 && assessment.governanceReviewRequired) return "DISPUTED";
  if (assessment.replayConfidence <= 0.2 || assessment.convergenceConfidence <= 0.2) return "BLOCKED";
  if (assessment.containmentPressure >= 0.75) return "CONTAINED";
  if (assessment.constitutionalRisk >= 0.7 || assessment.survivabilityImpact >= 0.7) return "ESCALATED";
  return "RANKED";
}

export function applyPrioritizationPolicies(assessment: RecoveryPrioritizationAssessment) {
  const category = categoryForAssessment(assessment);
  const state = stateForAssessment(assessment);
  const blocked = state === "BLOCKED" || state === "FROZEN";
  const disputed = state === "DISPUTED";

  return {
    ...assessment,
    category,
    state,
    prioritizationWarnings: Array.from(new Set([
      ...assessment.prioritizationWarnings,
      ...(blocked ? ["prioritization_blocked"] : []),
      ...(disputed ? ["prioritization_disputed"] : []),
    ])),
  };
}
