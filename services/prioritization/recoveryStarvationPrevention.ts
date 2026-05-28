import type { RecoveryPrioritizationAssessment, RecoveryPriorityCandidate } from "./prioritizationTypes";

export function detectRecoveryStarvation({
  rankedAssessments,
  candidates,
  tenantId,
}: {
  rankedAssessments: RecoveryPrioritizationAssessment[];
  candidates: RecoveryPriorityCandidate[];
  tenantId?: string;
}) {
  const warnings: string[] = [];
  const top = rankedAssessments[0];
  const survivabilityCritical = rankedAssessments.find((assessment) => assessment.category === "SURVIVABILITY_CRITICAL");
  const constitutionalCritical = rankedAssessments.find((assessment) => assessment.category === "CONSTITUTIONAL_CRITICAL");

  if (survivabilityCritical && top && survivabilityCritical.executionId !== top.executionId) {
    warnings.push(`survivability_critical_deferred:${survivabilityCritical.executionId}`);
  }
  if (constitutionalCritical && top && constitutionalCritical.executionId !== top.executionId) {
    warnings.push(`constitutional_priority_suppressed:${constitutionalCritical.executionId}`);
  }
  if (top && top.recoveryComplexity <= 0.25 && rankedAssessments.some((assessment) => assessment.category === "SURVIVABILITY_CRITICAL" && assessment.executionId !== top.executionId)) {
    warnings.push(`low_complexity_jumped_critical:${top.executionId}`);
  }
  if (tenantId && candidates.some((candidate) => candidate.tenantId && candidate.tenantId !== tenantId)) {
    warnings.push("cross_tenant_priority_contamination");
  }
  if (candidates.some((candidate) => candidate.operatorDirective === "PRIORITIZE") && top?.governanceReviewRequired) {
    warnings.push("unsafe_priority_inversion_attempt");
  }

  return warnings;
}
