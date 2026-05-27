import type { ConstitutionalReadinessInput, ContainmentReadinessRecord, ReadinessError } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";
import { hashReadinessValue } from "./readinessHashEngine";

export function validateContainmentGuarantees(input: ConstitutionalReadinessInput): {
  record: ContainmentReadinessRecord;
  errors: readonly ReadinessError[];
} {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const containmentPressure = input.adversarialTelemetryResult.metrics.containment_pressure_score;
  const signal = input.adversarialTelemetryResult.containmentPressure;
  const errors: ReadinessError[] = [];

  if (containmentPressure > 0 || signal.freezeRecommended) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_CONTAINMENT_PRESSURE_ELEVATED",
      message: "Containment pressure or freeze recommendation was detected in upstream telemetry.",
      path: "adversarialTelemetryResult.containmentPressure",
    }));
  }
  if (
    normalized.includes("hiddenorchestration")
    || normalized.includes("recursiveworkflow")
    || normalized.includes("authorityexpansion")
    || normalized.includes("executionsemantics")
    || normalized.includes("adaptiveautonomy")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_ANTI_EMERGENCE_FAILURE",
      message: "Hidden orchestration, recursive workflow, authority expansion, execution semantics, or adaptive autonomy markers were detected.",
      path: "metadata",
    }));
  }

  const record: ContainmentReadinessRecord = Object.freeze({
    readinessId: input.readinessId,
    containmentPressureScore: containmentPressure,
    freezeRecommended: signal.freezeRecommended,
    containmentGuaranteed: errors.length === 0,
    verificationHash: hashReadinessValue("constitutional-readiness-containment-record", {
      readinessId: input.readinessId,
      containmentPressure,
      freezeRecommended: signal.freezeRecommended,
      errors: errors.map((item) => item.code),
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
