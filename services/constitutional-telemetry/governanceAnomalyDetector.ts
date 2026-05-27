import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function detectGovernanceAnomalies(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const triggered = input.runtimeAdmissibilityResult.record.governanceSnapshotId
    !== input.constitutionalReplayResult.record.governanceSnapshotId
    || !input.runtimeAdmissibilityResult.governanceCheck.governanceBound;
  const errors = triggered
    ? [Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_GOVERNANCE_DETACHED" as const,
      message: "Telemetry detected detached or ambiguous governance state.",
      path: "runtimeAdmissibilityResult.record.governanceSnapshotId",
    })]
    : [];
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "governance_violation",
      triggered,
      severity: triggered ? "critical" : "none",
      reason: triggered ? "Governance lineage diverged from replay-certified constitutional state." : "Governance remained replay-bound and constitutionally stable.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-governance-event", {
        telemetryId: input.telemetryId,
        triggered,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
