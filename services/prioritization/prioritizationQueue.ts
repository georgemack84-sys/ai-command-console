import type { RecoveryPrioritizationAssessment } from "./prioritizationTypes";

export function buildPrioritizationQueue(assessments: RecoveryPrioritizationAssessment[]) {
  return {
    recoveryQueue: assessments
      .filter((assessment) => !["BLOCKED", "FROZEN", "DISPUTED"].includes(assessment.state))
      .map((assessment) => assessment.executionId),
    blockedRecoveries: assessments
      .filter((assessment) => assessment.state === "BLOCKED" || assessment.state === "FROZEN")
      .map((assessment) => assessment.executionId),
    disputedRecoveries: assessments
      .filter((assessment) => assessment.state === "DISPUTED")
      .map((assessment) => assessment.executionId),
  };
}
