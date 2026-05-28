import type { OperationalStabilityAssessment } from "./operationalStabilityEngine";

export type StabilityTelemetrySummary = {
  operationalState: string;
  survivabilityScore: number;
  degradationRate: number;
  recoveryPressure: number;
  escalationPressure: number;
  trend: string;
  unstableSubsystems: string[];
  stabilizationRequired: boolean;
  containmentRecommended: boolean;
  lockdownRecommended: boolean;
  disputed: boolean;
  reasons: string[];
  timestamp: string;
};

export function summarizeStabilityTelemetry(assessment: OperationalStabilityAssessment): StabilityTelemetrySummary {
  return {
    operationalState: assessment.operationalState,
    survivabilityScore: assessment.survivabilityScore,
    degradationRate: assessment.degradationRate,
    recoveryPressure: assessment.recoveryPressure,
    escalationPressure: assessment.escalationPressure,
    trend: assessment.trend,
    unstableSubsystems: [...assessment.unstableSubsystems],
    stabilizationRequired: assessment.stabilizationRequired,
    containmentRecommended: assessment.containmentRecommended,
    lockdownRecommended: assessment.lockdownRecommended,
    disputed: assessment.disputed,
    reasons: [...assessment.reasons],
    timestamp: assessment.timestamp,
  };
}
