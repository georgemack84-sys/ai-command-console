import type { ConstitutionalReadinessInput, GovernanceReadinessRecord, ReadinessError } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";
import { hashReadinessValue } from "./readinessHashEngine";

export function validateGovernanceReadiness(input: ConstitutionalReadinessInput): {
  record: GovernanceReadinessRecord;
  errors: readonly ReadinessError[];
} {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const governanceRate = input.adversarialTelemetryResult.metrics.governance_violation_rate;
  const errors: ReadinessError[] = [];

  if (governanceRate > 0) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_GOVERNANCE_DEGRADED",
      message: "Governance violations were detected in upstream telemetry.",
      path: "adversarialTelemetryResult.metrics.governance_violation_rate",
    }));
  }
  if (
    normalized.includes("governancesuppression")
    || normalized.includes("governancedrift")
    || normalized.includes("policymismatch")
    || normalized.includes("governancelineagemissing")
    || normalized.includes("constitutionalvalidationfails")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_GOVERNANCE_SUPREMACY_FAILURE",
      message: "Governance suppression, drift, mismatch, or missing lineage markers were detected.",
      path: "metadata",
    }));
  }

  const record: GovernanceReadinessRecord = Object.freeze({
    readinessId: input.readinessId,
    governanceViolationRate: governanceRate,
    governanceBound: errors.length === 0,
    verificationHash: hashReadinessValue("constitutional-readiness-governance-record", {
      readinessId: input.readinessId,
      governanceRate,
      errors: errors.map((item) => item.code),
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
