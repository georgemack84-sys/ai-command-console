import type {
  RecoveryPrioritizationAssessment,
  RecoveryPrioritizationAuditEvent,
  RecoveryPrioritizationAuditRecord,
} from "./prioritizationTypes";

function eventForAssessment(assessment: RecoveryPrioritizationAssessment): RecoveryPrioritizationAuditEvent {
  if (assessment.state === "FROZEN") return "PRIORITIZATION_FROZEN";
  if (assessment.state === "DISPUTED") return "PRIORITIZATION_DISPUTED";
  if (assessment.category === "CONSTITUTIONAL_CRITICAL") return "CONSTITUTIONAL_PRIORITY_TRIGGERED";
  if (assessment.category === "SURVIVABILITY_CRITICAL") return "SURVIVABILITY_PRIORITY_ESCALATED";
  return "RECOVERY_PRIORITIZED";
}

export function buildPrioritizationAuditRecords(
  assessments: RecoveryPrioritizationAssessment[],
): RecoveryPrioritizationAuditRecord[] {
  return assessments.map((assessment) => ({
    eventType: eventForAssessment(assessment),
    executionId: assessment.executionId,
    score: assessment.prioritizationScore,
    category: assessment.category,
    reasons: assessment.prioritizationReasons,
    warnings: assessment.prioritizationWarnings,
    evidence: [`priority:${assessment.executionId}:${assessment.deterministicRank}`],
    timestamp: assessment.timestamp,
  }));
}
