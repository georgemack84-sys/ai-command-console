import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  TelemetryError,
} from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function monitorReplayStability(input: ConstitutionalTelemetryInput): Readonly<{
  event: ConstitutionalTelemetryEvent;
  errors: readonly TelemetryError[];
  score: number;
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const anomalyDetected = !input.constitutionalAuditEpisodeResult.record.replaySafe
    || normalized.includes("replaycorruption")
    || normalized.includes("replaymismatch")
    || normalized.includes("validatordrift");
  return Object.freeze({
    event: Object.freeze({
      telemetryId: `${input.telemetryId}:replay`,
      domain: "replay",
      severity: anomalyDetected ? "critical" : "low",
      sourceId: input.constitutionalAuditEpisodeResult.record.episodeId,
      snapshotId: input.constitutionalAuditEpisodeResult.record.replaySnapshotId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      replayLineageHash: input.constitutionalAuditEpisodeResult.hashes.replayHash,
      escalationLineageHash: input.constitutionalAuditEpisodeResult.hashes.escalationHash,
      approvalLineageHash: input.constitutionalAuditEpisodeResult.hashes.approvalHash,
      anomalyDetected,
      escalationRequired: anomalyDetected,
      freezeRequired: anomalyDetected,
      forensicHash: hashTelemetryValue("telemetry-replay-event", {
        telemetryId: input.telemetryId,
        anomalyDetected,
      }),
      createdAt: input.createdAt,
    }),
    errors: anomalyDetected
      ? Object.freeze([
        Object.freeze({
          code: normalized.includes("validatordrift")
            ? "ADVERSARIAL_TELEMETRY_VALIDATOR_DRIFT" as const
            : "ADVERSARIAL_TELEMETRY_REPLAY_DIVERGENCE" as const,
          message: "Replay instability, corruption, or validator drift detected.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
    score: anomalyDetected ? 0 : 1,
  });
}
