import type { ConstitutionalReadinessInput, ReadinessGovernanceBinding } from "@/types/constitutional-readiness";
import { hashReadinessValue } from "./readinessHashEngine";

export function bindReadinessGovernance(input: ConstitutionalReadinessInput): ReadinessGovernanceBinding {
  const governanceBound = input.adversarialTelemetryResult.events.every((event) =>
    event.governanceSnapshotId === input.adversarialTelemetryResult.record.governanceSnapshotId)
    && !input.adversarialTelemetryResult.errors.some((item) => item.code.includes("GOVERNANCE"));
  return Object.freeze({
    readinessId: input.readinessId,
    governanceSnapshotId: input.adversarialTelemetryResult.record.governanceSnapshotId,
    governanceBound,
    bindingHash: hashReadinessValue("constitutional-readiness-governance-binding", {
      readinessId: input.readinessId,
      governanceSnapshotId: input.adversarialTelemetryResult.record.governanceSnapshotId,
      governanceBound,
    }),
  });
}
