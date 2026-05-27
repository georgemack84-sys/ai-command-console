import { clampMetric } from "../stability/stabilityMetrics";
import type { ValidationTelemetryPoint } from "./types";

export function buildValidationTelemetry(input: {
  governanceReadinessScore: number;
  operationalStabilityScore: number;
  replayIntegrityConfidence: number;
  rollbackSurvivabilityScore: number;
  simulationReliabilityScore: number;
  containmentConfidenceScore: number;
  constitutionalDisputeCount: number;
  recoveryConflictRate: number;
  operatorInterventionRate: number;
  escalationReliabilityScore: number;
  chaosSurvivabilityScore: number;
  validationFailureRate: number;
  timestamp: string;
}): ValidationTelemetryPoint[] {
  return [
    ["governance_readiness_score", input.governanceReadinessScore],
    ["operational_stability_score", input.operationalStabilityScore],
    ["replay_integrity_confidence", input.replayIntegrityConfidence],
    ["rollback_survivability_score", input.rollbackSurvivabilityScore],
    ["simulation_reliability_score", input.simulationReliabilityScore],
    ["containment_confidence_score", input.containmentConfidenceScore],
    ["constitutional_dispute_count", input.constitutionalDisputeCount],
    ["recovery_conflict_rate", input.recoveryConflictRate],
    ["operator_intervention_rate", input.operatorInterventionRate],
    ["escalation_reliability_score", input.escalationReliabilityScore],
    ["chaos_survivability_score", input.chaosSurvivabilityScore],
    ["validation_failure_rate", input.validationFailureRate],
  ].map(([metric, value]) => ({
    metric: metric as ValidationTelemetryPoint["metric"],
    value: clampMetric(Number(value), 0),
    timestamp: input.timestamp,
  }));
}
