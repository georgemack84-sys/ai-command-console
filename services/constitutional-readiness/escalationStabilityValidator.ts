import type { ConstitutionalReadinessInput, EscalationReadinessRecord, ReadinessError } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";
import { hashReadinessValue } from "./readinessHashEngine";

export function validateEscalationStability(input: ConstitutionalReadinessInput): {
  record: EscalationReadinessRecord;
  errors: readonly ReadinessError[];
} {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const escalationRate = input.adversarialTelemetryResult.metrics.escalation_failure_rate;
  const errors: ReadinessError[] = [];

  if (escalationRate > 0) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_ESCALATION_UNSTABLE",
      message: "Escalation failure or suppression was detected in upstream telemetry.",
      path: "adversarialTelemetryResult.metrics.escalation_failure_rate",
    }));
  }
  if (
    normalized.includes("escalationsuppression")
    || normalized.includes("escalationremoval")
    || normalized.includes("deadzone")
    || normalized.includes("oversighttransitionmissing")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_ESCALATION_SUPPRESSION",
      message: "Escalation suppression or missing oversight transition markers were detected.",
      path: "metadata",
    }));
  }

  const record: EscalationReadinessRecord = Object.freeze({
    readinessId: input.readinessId,
    escalationFailureRate: escalationRate,
    escalationStable: errors.length === 0,
    verificationHash: hashReadinessValue("constitutional-readiness-escalation-record", {
      readinessId: input.readinessId,
      escalationRate,
      errors: errors.map((item) => item.code),
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
