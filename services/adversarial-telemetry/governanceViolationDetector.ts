import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  TelemetryError,
} from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function detectGovernanceViolations(input: ConstitutionalTelemetryInput): Readonly<{
  event: ConstitutionalTelemetryEvent;
  errors: readonly TelemetryError[];
  violationRate: number;
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const anomalyDetected = !input.constitutionalAuditEpisodeResult.episode.governanceValidation.every((item) => item.governanceBound)
    || normalized.includes("governancesuppression")
    || normalized.includes("governancesubstitution")
    || normalized.includes("detachedgovernancelineage");
  return Object.freeze({
    event: Object.freeze({
      telemetryId: `${input.telemetryId}:governance`,
      domain: "governance",
      severity: anomalyDetected ? "critical" : "low",
      sourceId: input.constitutionalAuditEpisodeResult.record.episodeId,
      snapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      replayLineageHash: input.constitutionalAuditEpisodeResult.hashes.replayHash,
      escalationLineageHash: input.constitutionalAuditEpisodeResult.hashes.escalationHash,
      approvalLineageHash: input.constitutionalAuditEpisodeResult.hashes.approvalHash,
      anomalyDetected,
      escalationRequired: anomalyDetected,
      freezeRequired: anomalyDetected,
      forensicHash: hashTelemetryValue("telemetry-governance-event", {
        telemetryId: input.telemetryId,
        anomalyDetected,
      }),
      createdAt: input.createdAt,
    }),
    errors: anomalyDetected
      ? Object.freeze([
        Object.freeze({
          code: "ADVERSARIAL_TELEMETRY_GOVERNANCE_MISMATCH" as const,
          message: "Governance divergence, suppression, or detached lineage detected.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
    violationRate: anomalyDetected ? 1 : 0,
  });
}
