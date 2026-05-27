import type { ConstitutionalSurvivabilityAssessment } from "./constitutionalSurvivabilityFramework";
import { determineSurvivabilityState } from "./survivabilityPolicies";

export function assessConstitutionalSurvivability(input: {
  constitutionalIntegrity: number;
  governanceContinuity: number;
  operationalViability: number;
  containmentEffectiveness: number;
  auditPreservationConfidence: number;
  escalationPressure: number;
  systemicInstability: number;
  recoverabilityConfidence: number;
  unstableDomains: string[];
  failingDomains: string[];
  survivableDomains: string[];
  disputed: boolean;
  freezeActive: boolean;
  emergencyControlsRequired: boolean;
  operatorInterventionRequired: boolean;
  constitutionalRiskDetected: boolean;
  nowMs: number;
}) : ConstitutionalSurvivabilityAssessment {
  return {
    assessmentId: `survivability:${input.nowMs}`,
    survivabilityState: determineSurvivabilityState({
      constitutionalIntegrity: input.constitutionalIntegrity,
      governanceContinuity: input.governanceContinuity,
      operationalViability: input.operationalViability,
      systemicInstability: input.systemicInstability,
      recoverabilityConfidence: input.recoverabilityConfidence,
      containmentEffectiveness: input.containmentEffectiveness,
      disputed: input.disputed,
      freezeActive: input.freezeActive,
      emergencyControlsRequired: input.emergencyControlsRequired,
    }),
    constitutionalIntegrity: input.constitutionalIntegrity,
    governanceContinuity: input.governanceContinuity,
    operationalViability: input.operationalViability,
    containmentEffectiveness: input.containmentEffectiveness,
    auditPreservationConfidence: input.auditPreservationConfidence,
    escalationPressure: input.escalationPressure,
    systemicInstability: input.systemicInstability,
    recoverabilityConfidence: input.recoverabilityConfidence,
    isolatedDomains: [],
    failingDomains: input.failingDomains,
    survivableDomains: input.survivableDomains,
    emergencyControlsRequired: input.emergencyControlsRequired,
    operatorInterventionRequired: input.operatorInterventionRequired,
    constitutionalRiskDetected: input.constitutionalRiskDetected,
    createdAt: input.nowMs,
  };
}
