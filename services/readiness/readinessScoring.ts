import { clampMetric } from "../stability/stabilityMetrics";

export function scoreAutonomousRecoveryReadiness(input: {
  governanceConfidence: number;
  simulationTrustScore: number;
  rollbackConfidence: number;
  containmentConfidence: number;
  convergenceConfidence: number;
  escalationReliability: number;
  constitutionalIntegrity: number;
  auditCompleteness: number;
  recoveryIntelligenceStability: number;
}) {
  const normalized =
    clampMetric(input.constitutionalIntegrity) * 0.2
    + clampMetric(input.governanceConfidence) * 0.15
    + clampMetric(input.auditCompleteness) * 0.15
    + clampMetric(input.simulationTrustScore) * 0.1
    + clampMetric(input.rollbackConfidence) * 0.1
    + clampMetric(input.containmentConfidence) * 0.1
    + clampMetric(input.convergenceConfidence) * 0.1
    + clampMetric(input.escalationReliability) * 0.05
    + clampMetric(input.recoveryIntelligenceStability) * 0.05;

  return Math.round(clampMetric(normalized) * 100);
}

export function scoreConstitutionalReadiness(input: {
  governanceReliability: number;
  auditIntegrity: number;
  containmentSurvivability: number;
  escalationCoordinationReliability: number;
  simulationTrustworthiness: number;
  continuityStability: number;
  operatorOverrideReliability: number;
  enforcementConsistency: number;
  operationalExplainability: number;
  deterministicRecoveryConfidence: number;
}) {
  const normalized =
    clampMetric(input.governanceReliability) * 0.14
    + clampMetric(input.auditIntegrity) * 0.14
    + clampMetric(input.containmentSurvivability) * 0.12
    + clampMetric(input.escalationCoordinationReliability) * 0.08
    + clampMetric(input.simulationTrustworthiness) * 0.1
    + clampMetric(input.continuityStability) * 0.1
    + clampMetric(input.operatorOverrideReliability) * 0.08
    + clampMetric(input.enforcementConsistency) * 0.1
    + clampMetric(input.operationalExplainability) * 0.07
    + clampMetric(input.deterministicRecoveryConfidence) * 0.07;

  return Number(clampMetric(normalized, 0.05).toFixed(4));
}
