import { clampMetric } from "../stability/stabilityMetrics";

export function evaluateConstitutionalContinuity(input: {
  governanceConfidence: number;
  constitutionalIntegrity: number;
  auditHistoryLength: number;
  disputedTruthPresent: boolean;
}) {
  const governanceContinuity = clampMetric(
    input.governanceConfidence * 0.55
      + input.constitutionalIntegrity * 0.35
      + Math.min(input.auditHistoryLength / 10, 1) * 0.1
      - (input.disputedTruthPresent ? 0.3 : 0),
    0.05,
  );
  const auditPreservationConfidence = clampMetric(
    Math.min(input.auditHistoryLength / 8, 1) * 0.6
      + input.constitutionalIntegrity * 0.3
      + (input.disputedTruthPresent ? 0.02 : 0.1),
    0.05,
  );

  return {
    governanceContinuity,
    auditPreservationConfidence,
  };
}
