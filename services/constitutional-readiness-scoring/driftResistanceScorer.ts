import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  DriftResistanceRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function scoreDriftResistance(input: ConstitutionalReadinessInput): {
  record: DriftResistanceRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const anomalyCount = input.constitutionalTelemetryResult.events.filter((event) => event.triggered).length
    + input.antiEmergenceResult.signals.filter((signal) => signal.triggered).length;
  const driftResistant = anomalyCount < 2 && input.constitutionalTelemetryResult.errors.length === 0;
  const score = Math.max(0, Number((1 - anomalyCount * 0.2).toFixed(4)));

  const errors: ConstitutionalReadinessError[] = [];
  if (!driftResistant) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_AUTHORITY_BOUNDARY_DRIFT",
      message: "Drift resistance weakened under telemetry or containment pressure.",
      path: "constitutionalTelemetryResult.events",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      telemetryId: input.constitutionalTelemetryResult.record.telemetryId,
      driftResistant,
      anomalyCount,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-drift-resistance", {
        telemetryId: input.constitutionalTelemetryResult.record.telemetryId,
        driftResistant,
        anomalyCount,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
