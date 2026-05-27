import type {
  ConstitutionalTelemetryInput,
  ConstitutionalTimelineRecord,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function rebuildConstitutionalTimeline(
  input: ConstitutionalTelemetryInput,
): ConstitutionalTimelineRecord {
  return Object.freeze({
    timelineId: hashConstitutionalTelemetryValue("constitutional-telemetry-timeline-id", input.telemetryId),
    telemetryId: input.telemetryId,
    governanceLineageHash: input.constitutionalReplayResult.historicalGovernance.governanceHash,
    replayLineageHash: input.constitutionalReplayResult.lineage.lineageHash,
    escalationLineageHash: input.escalationDeterminismResult.lineage.lineageHash,
    overrideLineageHash: input.humanSupremacyResult.lineage.lineageHash,
    containmentLineageHash: input.antiEmergenceResult.lineage.lineageHash,
    timelineHash: hashConstitutionalTelemetryValue("constitutional-telemetry-timeline", {
      governanceLineageHash: input.constitutionalReplayResult.historicalGovernance.governanceHash,
      replayLineageHash: input.constitutionalReplayResult.lineage.lineageHash,
      escalationLineageHash: input.escalationDeterminismResult.lineage.lineageHash,
      overrideLineageHash: input.humanSupremacyResult.lineage.lineageHash,
      containmentLineageHash: input.antiEmergenceResult.lineage.lineageHash,
    }),
  });
}
