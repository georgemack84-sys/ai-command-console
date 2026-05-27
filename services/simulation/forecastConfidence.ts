import { clampMetric } from "../stability/stabilityMetrics";
import { getSimulationThresholds } from "./simulationThresholds";
import type { ForecastUncertaintyLevel, RecoverySimulationResult, SimulationInput } from "./simulationTypes";

function uncertaintyForConfidence(confidenceScore: number): ForecastUncertaintyLevel {
  if (confidenceScore >= 0.8) return "LOW";
  if (confidenceScore >= 0.6) return "MODERATE";
  if (confidenceScore >= 0.35) return "HIGH";
  return "SEVERE";
}

export function computeForecastConfidence({
  input,
  baseConfidence,
}: {
  input: SimulationInput;
  baseConfidence: number;
}) {
  const thresholds = getSimulationThresholds();
  const reasons: string[] = [];
  let confidence = baseConfidence;

  const evidenceQuality = clampMetric(((input.dashboard.auditHistory?.length || 0) / 12), 0.2);
  confidence = Math.min(confidence, evidenceQuality);
  if (confidence < baseConfidence) reasons.push("confidence_capped_by_evidence_quality");

  if ((input.dashboard.continuityConvergence?.converged ?? false) === false) {
    confidence -= 0.12;
    reasons.push("convergence_not_achieved");
  }
  if (input.dashboard.governanceDisputes?.length) {
    confidence -= 0.18;
    reasons.push("governance_disputes_present");
  }
  if (input.dashboard.stewardship?.shouldFreeze || input.dashboard.continuityConvergence?.requiresFreeze) {
    confidence -= 0.18;
    reasons.push("frozen_chain_degrades_confidence");
  }
  if ((input.dashboard.escalationCoordination?.frozen ?? false) || (input.dashboard.operationalStabilityAssessment?.escalationPressure ?? 0) > thresholds.degradedConfidenceThreshold) {
    confidence -= 0.1;
    reasons.push("escalation_pressure_high");
  }
  if ((input.dashboard.operationalStabilityAssessment?.containmentRecommended ?? false) || (input.dashboard.continuityConvergence?.requiresContainment ?? false)) {
    confidence -= 0.1;
    reasons.push("containment_pressure_high");
  }
  if ((input.dashboard.continuityConvergence?.staleOwnershipClaims?.length || 0) > 0) {
    confidence -= 0.08;
    reasons.push("stale_ownership_detected");
  }

  const confidenceScore = clampMetric(confidence, 0.1);
  return {
    confidenceScore,
    uncertaintyLevel: uncertaintyForConfidence(confidenceScore),
    degradationReasons: reasons,
  };
}

export function applyForecastConfidence(
  simulation: Omit<RecoverySimulationResult, "confidenceScore" | "uncertaintyLevel">,
  confidenceScore: number,
  uncertaintyLevel: ForecastUncertaintyLevel,
): RecoverySimulationResult {
  return {
    ...simulation,
    confidenceScore,
    uncertaintyLevel,
  };
}
