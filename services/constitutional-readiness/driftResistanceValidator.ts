import type { ConstitutionalReadinessInput, DriftResistanceRecord, ReadinessError } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";
import { hashReadinessValue } from "./readinessHashEngine";

export function validateDriftResistance(input: ConstitutionalReadinessInput): {
  record: DriftResistanceRecord;
  errors: readonly ReadinessError[];
} {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const governanceRate = input.adversarialTelemetryResult.metrics.governance_violation_rate;
  const recommendationRate = input.adversarialTelemetryResult.metrics.recommendation_anomaly_rate;
  const replayScore = input.adversarialTelemetryResult.metrics.replay_stability_score;
  const driftPressure = Number((governanceRate + recommendationRate + (1 - replayScore)).toFixed(4));
  const errors: ReadinessError[] = [];

  if (driftPressure > 0) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_DRIFT_RESISTANCE_DEGRADED",
      message: "Upstream governance, recommendation, or replay drift pressure is non-zero.",
      path: "adversarialTelemetryResult.metrics",
    }));
  }
  if (
    normalized.includes("validatordrift")
    || normalized.includes("topologydrift")
    || normalized.includes("syntheticlineagerepair")
    || normalized.includes("containmentdegradation")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_DRIFT_INTEGRITY_FAILURE",
      message: "Validator drift, topology drift, synthetic lineage repair, or containment degradation markers were detected.",
      path: "metadata",
    }));
  }

  const record: DriftResistanceRecord = Object.freeze({
    readinessId: input.readinessId,
    driftPressureScore: driftPressure,
    driftResistant: errors.length === 0,
    verificationHash: hashReadinessValue("constitutional-readiness-drift-record", {
      readinessId: input.readinessId,
      driftPressure,
      errors: errors.map((item) => item.code),
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
