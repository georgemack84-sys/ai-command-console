import type { ConstitutionalCertificationInput } from "./certificationStateTypes";

export function analyzeCertificationContainmentPressure(
  input: ConstitutionalCertificationInput,
): number {
  return Number(Math.min(
    1,
    (
      input.constitutionalRuntimeSimulationResult.report.containmentPressureScore
      + input.constitutionalReadinessResult.uncertaintyPenalty.penalty
      + (input.constitutionalTelemetryResult.events.filter((event) => event.triggered).length * 0.05)
    ),
  ).toFixed(4));
}
