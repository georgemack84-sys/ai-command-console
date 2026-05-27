import { clampMetric } from "../stability/stabilityMetrics";
import { determineReadinessState } from "./readinessPolicies";
import { scoreAutonomousRecoveryReadiness } from "./readinessScoring";
import type {
  AutonomousRecoveryReadinessAssessment,
  ReadinessDomain,
  ReadinessValidationInput,
} from "./readinessTypes";
import { validateAutonomousRecoveryReadiness } from "./readinessValidation";

function hasRollbackSimulation(simulationForecast: Record<string, unknown>) {
  const simulations = Array.isArray(simulationForecast.simulations) ? simulationForecast.simulations as Array<Record<string, unknown>> : [];
  return simulations.some((simulation) => String(simulation.simulationType || "") === "ROLLBACK");
}

export function evaluateAutonomousRecoveryReadiness(
  input: ReadinessValidationInput & { timestamp?: string },
): AutonomousRecoveryReadinessAssessment {
  const validation = validateAutonomousRecoveryReadiness(input);

  const constitutional = (input.constitutionalEnforcement || {}) as Record<string, unknown>;
  const decision = (input.decisionIntelligence || {}) as Record<string, unknown>;
  const simulationForecast = (input.simulationForecast || {}) as Record<string, unknown>;
  const convergence = (input.convergence || {}) as Record<string, unknown>;
  const stability = (input.stability || {}) as Record<string, unknown>;
  const escalation = (input.escalation || {}) as Record<string, unknown>;
  const containment = (input.containment || {}) as Record<string, unknown>;
  const rollback = (input.rollback || {}) as Record<string, unknown>;
  const auditEvidence = Array.isArray(input.auditEvidence) ? input.auditEvidence : [];

  const constitutionalIntegrity = clampMetric(
    validation.constitutionalBlocked ? 0.1
      : validation.disputed ? 0.2
      : String(constitutional.constitutionalAction || "ALLOW") === "WARN" ? 0.82
      : 0.92,
    0.1,
  );
  const governanceConfidence = clampMetric(
    decision.requiresApproval === true ? 0.74 : 0.6,
    0.1,
  );
  const auditCompleteness = clampMetric(auditEvidence.length / 6, 0.1);
  const simulationTrustScore = clampMetric(
    (simulationForecast.evidenceSufficient === true ? 0.65 : 0.25)
      + (hasRollbackSimulation(simulationForecast) ? 0.2 : 0),
    0.1,
  );
  const rollbackConfidence = clampMetric(
    (rollback.guaranteed === true ? Number(rollback.confidence ?? 0.7) : 0.1),
    0.1,
  );
  const containmentConfidence = clampMetric(
    Number(containment.confidence ?? ((containment.requiresContainment ?? false) ? 0.35 : 0.6)),
    0.1,
  );
  const convergenceConfidence = clampMetric(
    Number(convergence.continuityConfidence ?? 0.2),
    0.1,
  );
  const escalationReliability = clampMetric(
    Number(escalation.confidence ?? 0.25) - ((escalation.frozen || escalation.blocked) ? 0.2 : 0),
    0.1,
  );
  const recoveryIntelligenceStability = clampMetric(
    Number(stability.confidence ?? 0.25) - ((stability.disputed ?? false) ? 0.2 : 0),
    0.1,
  );

  const readinessScore = scoreAutonomousRecoveryReadiness({
    governanceConfidence,
    simulationTrustScore,
    rollbackConfidence,
    containmentConfidence,
    convergenceConfidence,
    escalationReliability,
    constitutionalIntegrity,
    auditCompleteness,
    recoveryIntelligenceStability,
  });

  const readinessState = determineReadinessState({
    constitutionalBlocked: validation.constitutionalBlocked,
    disputed: validation.disputed,
    missingRollback: rollback.guaranteed !== true,
    containmentUnreliable: containmentConfidence < 0.55,
    auditInsufficient: auditCompleteness < 0.55,
    score: readinessScore,
    degraded: Boolean(stability.stabilizationRequired) || Number(convergence.divergenceScore ?? 0) >= 0.45,
    governanceIncomplete: governanceConfidence < 0.8,
    strongSignals:
      constitutionalIntegrity >= 0.85
      && governanceConfidence >= 0.8
      && rollbackConfidence >= 0.75
      && containmentConfidence >= 0.7
      && simulationTrustScore >= 0.7
      && convergenceConfidence >= 0.7
      && auditCompleteness >= 0.8
      && validation.disputed === false
      && validation.constitutionalBlocked === false,
  });

  const evaluatedDomains: ReadinessDomain[] = [
    "GOVERNANCE",
    "RECOVERY_INTELLIGENCE",
    "AUDIT",
    "SIMULATION",
    "CONVERGENCE",
    "ESCALATION",
    "CONTAINMENT",
    "ROLLBACK",
    "CONSTITUTIONAL",
  ];

  return {
    readinessState,
    readinessScore,
    governanceConfidence,
    simulationTrustScore,
    rollbackConfidence,
    containmentConfidence,
    convergenceConfidence,
    escalationReliability,
    constitutionalIntegrity,
    auditCompleteness,
    recoveryIntelligenceStability,
    requiresOperatorApproval: true,
    autonomyBlockedReasons: validation.blockedReasons,
    advisoryOnly: true,
    liveAutonomyEnabled: false,
    evaluatedDomains,
    timestamp: input.timestamp || new Date().toISOString(),
  };
}
