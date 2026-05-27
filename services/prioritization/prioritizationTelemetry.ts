import { clampMetric } from "../stability/stabilityMetrics";
import type {
  RecoveryPrioritizationAssessment,
  RecoveryPrioritizationTelemetryEvent,
} from "./prioritizationTypes";

export function buildPrioritizationTelemetry(
  assessments: RecoveryPrioritizationAssessment[],
  timestamp: string,
): RecoveryPrioritizationTelemetryEvent[] {
  if (assessments.length === 0) {
    return [];
  }

  const averageScore = assessments.reduce((total, assessment) => total + assessment.prioritizationScore, 0) / assessments.length;

  return [
    {
      eventType: "prioritization.average_score",
      value: clampMetric(averageScore, 1),
      timestamp,
    },
    {
      eventType: "prioritization.blocked_count",
      value: assessments.filter((assessment) => assessment.state === "BLOCKED" || assessment.state === "FROZEN").length,
      timestamp,
    },
  ];
}
