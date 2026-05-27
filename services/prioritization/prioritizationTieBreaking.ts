import type { RecoveryPrioritizationAssessment } from "./prioritizationTypes";

function ageValue(timestamp?: string) {
  if (!timestamp) return 0;
  const value = Date.parse(timestamp);
  return Number.isFinite(value) ? value : 0;
}

export function comparePriorities(a: RecoveryPrioritizationAssessment, b: RecoveryPrioritizationAssessment) {
  return (
    b.constitutionalRisk - a.constitutionalRisk
    || b.survivabilityImpact - a.survivabilityImpact
    || (1 - a.continuityStability) - (1 - b.continuityStability)
    || b.divergenceScore - a.divergenceScore
    || a.replayConfidence - b.replayConfidence
    || ageValue(a.timestamp) - ageValue(b.timestamp)
    || a.executionId.localeCompare(b.executionId)
  );
}

export function assignDeterministicRanks(
  assessments: RecoveryPrioritizationAssessment[],
): RecoveryPrioritizationAssessment[] {
  return [...assessments]
    .sort(comparePriorities)
    .map((assessment, index) => ({
      ...assessment,
      deterministicRank: index + 1,
      state: assessment.state === "SCORING" ? "RANKED" : assessment.state,
    }));
}
