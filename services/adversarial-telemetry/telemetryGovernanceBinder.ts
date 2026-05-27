import type { ConstitutionalTelemetryInput, TelemetryGovernanceBinding } from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function bindTelemetryGovernance(input: ConstitutionalTelemetryInput): TelemetryGovernanceBinding {
  const governanceBound = input.constitutionalAuditEpisodeResult.episode.governanceValidation.every((item) => item.governanceBound);
  return Object.freeze({
    governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
    governanceBound,
    governanceHash: hashTelemetryValue("telemetry-governance-binding", {
      telemetryId: input.telemetryId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      governanceBound,
    }),
  });
}
