import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
  DriftResistanceCertificationRecord,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyConstitutionalDriftResistance(input: ConstitutionalCertificationInput): {
  record: DriftResistanceCertificationRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const driftCount =
    input.constitutionalTelemetryResult.events.filter((event) => event.triggered).length
    + input.antiEmergenceResult.signals.filter((signal) => signal.triggered).length;
  const resistant = input.constitutionalReadinessResult.driftResistance.driftResistant && driftCount < 3;
  const score = resistant ? 1 : Number(Math.max(0, 0.8 - driftCount * 0.2).toFixed(4));
  const errors: ConstitutionalCertificationError[] = [];
  if (!resistant) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_DRIFT",
      message: "Drift resistance certification failed.",
      path: "drift",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      telemetryId: input.constitutionalReadinessResult.record.telemetryId,
      resistant,
      driftCount,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-drift-resistance", {
        telemetryId: input.constitutionalReadinessResult.record.telemetryId,
        resistant,
        driftCount,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
