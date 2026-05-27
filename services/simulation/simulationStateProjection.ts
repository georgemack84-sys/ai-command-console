import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryProjectedOutcome, SimulationInput, SimulationScenario } from "./simulationTypes";

export function projectSimulationState({
  scenario,
  input,
}: {
  scenario: SimulationScenario;
  input: SimulationInput;
}) {
  const survivabilityScore = clampMetric(
    (input.dashboard.operationalStabilityAssessment?.survivabilityScore ?? 0.3) * 0.45
      + (input.dashboard.stewardship?.survivabilityScore ?? 0.3) * 0.35
      + (input.dashboard.continuityConvergence?.survivabilityConfidence ?? 0.2) * 0.2,
    0.1,
  );
  const continuityConfidence = clampMetric(
    input.dashboard.continuityConvergence?.continuityConfidence ?? input.dashboard.continuityConfidence ?? 0.25,
    0.1,
  );
  const escalationProbability = clampMetric(
    (input.dashboard.operationalStabilityAssessment?.escalationPressure ?? 0.25) * 0.55
      + (input.dashboard.continuityConvergence?.requiresEscalation ? 0.25 : 0)
      + (scenario.disputed ? 0.15 : 0),
    0.1,
  );
  const operationalTrustProjection = clampMetric(
    continuityConfidence * 0.4
      + survivabilityScore * 0.35
      + (1 - escalationProbability) * 0.25,
    0.1,
  );

  let projectedOutcome: RecoveryProjectedOutcome = "SUCCESS";
  if (scenario.frozen || scenario.disputed) projectedOutcome = "UNSTABLE";
  if ((input.dashboard.continuityConvergence?.requiresContainment ?? false) || (input.dashboard.operationalStabilityAssessment?.containmentRecommended ?? false)) projectedOutcome = "CONTAINMENT_REQUIRED";
  if (escalationProbability >= 0.7) projectedOutcome = "ESCALATION_REQUIRED";
  if (survivabilityScore <= 0.2 || operationalTrustProjection <= 0.2) projectedOutcome = "FAILURE";
  if ((input.dashboard.continuityConvergence?.divergenceScore ?? 0) >= 0.8) projectedOutcome = "COLLAPSE_RISK";
  if (projectedOutcome === "SUCCESS" && (survivabilityScore < 0.6 || continuityConfidence < 0.6)) projectedOutcome = "PARTIAL_SUCCESS";

  return {
    projectedOutcome,
    survivabilityScore,
    continuityConfidence,
    escalationProbability,
    operationalTrustProjection,
  };
}
