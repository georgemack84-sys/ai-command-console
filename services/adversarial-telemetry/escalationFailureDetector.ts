import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  TelemetryError,
  TelemetryEscalationRecord,
} from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function detectEscalationFailures(input: ConstitutionalTelemetryInput): Readonly<{
  event: ConstitutionalTelemetryEvent;
  record: TelemetryEscalationRecord;
  errors: readonly TelemetryError[];
  failureRate: number;
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const failureDetected = normalized.includes("escalationsuppression")
    || normalized.includes("escalationdeadzones")
    || normalized.includes("missingoversighttransitions");
  return Object.freeze({
    event: Object.freeze({
      telemetryId: `${input.telemetryId}:escalation`,
      domain: "escalation",
      severity: failureDetected ? "critical" : "low",
      sourceId: input.constitutionalAuditEpisodeResult.record.episodeId,
      snapshotId: input.constitutionalAuditEpisodeResult.evidence.escalationLineageId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      replayLineageHash: input.constitutionalAuditEpisodeResult.hashes.replayHash,
      escalationLineageHash: input.constitutionalAuditEpisodeResult.hashes.escalationHash,
      approvalLineageHash: input.constitutionalAuditEpisodeResult.hashes.approvalHash,
      anomalyDetected: failureDetected,
      escalationRequired: failureDetected,
      freezeRequired: failureDetected,
      forensicHash: hashTelemetryValue("telemetry-escalation-event", {
        telemetryId: input.telemetryId,
        failureDetected,
      }),
      createdAt: input.createdAt,
    }),
    record: Object.freeze({
      escalationId: `${input.telemetryId}:escalation-record`,
      sourceId: input.constitutionalAuditEpisodeResult.evidence.escalationLineageId,
      escalationFailureDetected: failureDetected,
      deterministicHash: hashTelemetryValue("telemetry-escalation-record", {
        telemetryId: input.telemetryId,
        failureDetected,
      }),
    }),
    errors: failureDetected
      ? Object.freeze([
        Object.freeze({
          code: "ADVERSARIAL_TELEMETRY_ESCALATION_FAILURE" as const,
          message: "Escalation suppression, degradation, or dead-zones detected.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
    failureRate: failureDetected ? 1 : 0,
  });
}
