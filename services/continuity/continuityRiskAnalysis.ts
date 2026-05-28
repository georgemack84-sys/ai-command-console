import { clampMetric } from "../stability/stabilityMetrics";

export function analyzeContinuityRisk(input: {
  governanceConfidence: number;
  containmentConfidence: number;
  escalationPressure: number;
  disputedTruth: boolean;
  validationBlockedReasons: string[];
}) {
  const riskSignals: string[] = [];

  if (input.governanceConfidence < 0.55) riskSignals.push("governance_degradation_detected");
  if (input.containmentConfidence < 0.55) riskSignals.push("containment_weakness_detected");
  if (input.escalationPressure >= 0.7) riskSignals.push("escalation_saturation_detected");
  if (input.disputedTruth) riskSignals.push("constitutional_conflict_growth_detected");
  if (input.validationBlockedReasons.length > 0) riskSignals.push("validation_instability_detected");

  const collapseRisk = clampMetric(
    (input.governanceConfidence < 0.55 ? 0.26 : 0.08)
      + (input.containmentConfidence < 0.55 ? 0.24 : 0.08)
      + input.escalationPressure * 0.28
      + (input.disputedTruth ? 0.18 : 0)
      + (input.validationBlockedReasons.length > 0 ? 0.12 : 0),
    0.05,
  );

  return {
    riskSignals,
    collapseRisk,
  };
}
