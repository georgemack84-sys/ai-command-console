import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  TelemetryApprovalRecord,
  TelemetryError,
} from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function monitorApprovalInstability(input: ConstitutionalTelemetryInput): Readonly<{
  event: ConstitutionalTelemetryEvent;
  record: TelemetryApprovalRecord;
  errors: readonly TelemetryError[];
  instabilityScore: number;
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const instabilityDetected = input.constitutionalAuditEpisodeResult.episode.approvalDependencies.some((item) => item.dependencyState !== "stable")
    || normalized.includes("approvalinjection")
    || normalized.includes("circularapprovalchains")
    || normalized.includes("staleapprovals");
  return Object.freeze({
    event: Object.freeze({
      telemetryId: `${input.telemetryId}:approval`,
      domain: "approval",
      severity: instabilityDetected ? "critical" : "low",
      sourceId: input.constitutionalAuditEpisodeResult.record.episodeId,
      snapshotId: input.constitutionalAuditEpisodeResult.evidence.approvalLineageId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      replayLineageHash: input.constitutionalAuditEpisodeResult.hashes.replayHash,
      escalationLineageHash: input.constitutionalAuditEpisodeResult.hashes.escalationHash,
      approvalLineageHash: input.constitutionalAuditEpisodeResult.hashes.approvalHash,
      anomalyDetected: instabilityDetected,
      escalationRequired: instabilityDetected,
      freezeRequired: instabilityDetected,
      forensicHash: hashTelemetryValue("telemetry-approval-event", {
        telemetryId: input.telemetryId,
        instabilityDetected,
      }),
      createdAt: input.createdAt,
    }),
    record: Object.freeze({
      approvalId: `${input.telemetryId}:approval-record`,
      sourceId: input.constitutionalAuditEpisodeResult.evidence.approvalLineageId,
      instabilityDetected,
      deterministicHash: hashTelemetryValue("telemetry-approval-record", {
        telemetryId: input.telemetryId,
        instabilityDetected,
      }),
    }),
    errors: instabilityDetected
      ? Object.freeze([
        Object.freeze({
          code: "ADVERSARIAL_TELEMETRY_APPROVAL_MISMATCH" as const,
          message: "Approval drift, injection, staleness, or circularity detected.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
    instabilityScore: instabilityDetected ? 1 : 0,
  });
}
