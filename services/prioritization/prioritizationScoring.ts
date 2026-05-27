import { clampMetric } from "../stability/stabilityMetrics";
import type {
  ConvergencePrioritySignals,
  RecoveryPrioritizationAssessment,
  RecoveryPriorityCandidate,
} from "./prioritizationTypes";

function normalize(value: number | undefined, fallback: number) {
  return clampMetric(value, fallback);
}

export function scoreRecoveryCandidate({
  candidate,
  convergence,
  survivabilityImpact,
  timestamp,
}: {
  candidate: RecoveryPriorityCandidate;
  convergence: ConvergencePrioritySignals;
  survivabilityImpact: number;
  timestamp: string;
}): RecoveryPrioritizationAssessment {
  const operationalCriticality = normalize(candidate.operationalCriticality, 0.5);
  const governanceRisk = normalize(candidate.governanceRisk, 0.5);
  const replayConfidence = normalize(candidate.replayConfidence, 0.35);
  const escalationSeverity = normalize(candidate.escalationSeverity, 0.3);
  const dependencyImportance = normalize(candidate.dependencyImportance, 0.45);
  const continuityStability = normalize(candidate.continuityStability, 0.4);
  const tenantImpact = normalize(candidate.tenantImpact, 0.35);
  const recoveryComplexity = normalize(candidate.recoveryComplexity, 0.4);
  const recoveryUrgency = normalize(candidate.recoveryUrgency, 0.4);

  const prioritizationScore = clampMetric(
    survivabilityImpact * 0.18
      + convergence.constitutionalRisk * 0.18
      + governanceRisk * 0.1
      + (1 - continuityStability) * 0.1
      + convergence.divergenceScore * 0.1
      + (1 - replayConfidence) * 0.06
      + escalationSeverity * 0.08
      + dependencyImportance * 0.06
      + tenantImpact * 0.04
      + recoveryUrgency * 0.06
      + convergence.runtimeDriftSeverity * 0.04,
    1,
  );

  const prioritizationReasons = [
    ...(convergence.constitutionalRisk >= 0.65 ? ["constitutional_risk_elevated"] : []),
    ...(survivabilityImpact >= 0.65 ? ["survivability_impact_elevated"] : []),
    ...(convergence.divergenceScore >= 0.55 ? ["convergence_divergence_elevated"] : []),
    ...(replayConfidence <= 0.4 ? ["replay_confidence_low"] : []),
    ...(candidate.operatorDirective === "PRIORITIZE" ? ["operator_requested_priority"] : []),
  ];
  const prioritizationWarnings = [
    ...(candidate.operatorDirective === "DEPRIORITIZE" ? ["operator_requested_deprioritization"] : []),
    ...(governanceRisk >= 0.7 ? ["governance_review_pressure"] : []),
    ...convergence.warnings,
  ];

  return {
    executionId: candidate.executionId,
    prioritizationScore,
    category: "STANDARD",
    state: "SCORING",
    operationalCriticality,
    survivabilityImpact,
    governanceRisk,
    replayConfidence,
    escalationSeverity,
    dependencyImportance,
    continuityStability,
    tenantImpact,
    convergenceConfidence: convergence.convergenceConfidence,
    divergenceScore: convergence.divergenceScore,
    runtimeDriftSeverity: convergence.runtimeDriftSeverity,
    staleOwnershipRisk: convergence.staleOwnershipRisk,
    orphanedOperationRisk: convergence.orphanedOperationRisk,
    replayDivergenceRisk: convergence.replayDivergenceRisk,
    constitutionalRisk: convergence.constitutionalRisk,
    containmentPressure: convergence.containmentPressure,
    recoveryComplexity,
    recoveryUrgency,
    deterministicRank: -1,
    governanceReviewRequired: governanceRisk >= 0.7 || candidate.operatorDirective === "PRIORITIZE",
    prioritizationReasons,
    prioritizationWarnings,
    timestamp,
  };
}
