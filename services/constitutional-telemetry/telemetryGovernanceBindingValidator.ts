import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
} from "./telemetryStateTypes";

export function validateTelemetryGovernanceBinding(
  input: ConstitutionalTelemetryInput,
): readonly ConstitutionalTelemetryError[] {
  const sameSnapshot = input.constitutionalReplayResult.record.governanceSnapshotId
    === input.runtimeAdmissibilityResult.record.governanceSnapshotId;
  if (sameSnapshot && input.runtimeAdmissibilityResult.governanceBinding.governanceBound) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "CONSTITUTIONAL_TELEMETRY_GOVERNANCE_DETACHED",
    message: "Telemetry governance binding detached from replay-certified governance snapshot.",
    path: "runtimeAdmissibilityResult.record.governanceSnapshotId",
  })]);
}
