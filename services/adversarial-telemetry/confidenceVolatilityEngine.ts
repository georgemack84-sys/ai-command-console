import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  TelemetryConfidenceRecord,
  TelemetryError,
} from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function analyzeConfidenceVolatility(input: ConstitutionalTelemetryInput): Readonly<{
  event: ConstitutionalTelemetryEvent;
  record: TelemetryConfidenceRecord;
  errors: readonly TelemetryError[];
  volatilityScore: number;
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const volatile = normalized.includes("confidencemanipulation")
    || normalized.includes("confidencecollapsechains")
    || normalized.includes("confidencespoofing");
  return Object.freeze({
    event: Object.freeze({
      telemetryId: `${input.telemetryId}:confidence`,
      domain: "confidence",
      severity: volatile ? "high" : "low",
      sourceId: input.constitutionalAuditEpisodeResult.record.episodeId,
      snapshotId: input.constitutionalAuditEpisodeResult.record.simulationId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      replayLineageHash: input.constitutionalAuditEpisodeResult.hashes.replayHash,
      escalationLineageHash: input.constitutionalAuditEpisodeResult.hashes.escalationHash,
      approvalLineageHash: input.constitutionalAuditEpisodeResult.hashes.approvalHash,
      anomalyDetected: volatile,
      escalationRequired: volatile,
      freezeRequired: false,
      forensicHash: hashTelemetryValue("telemetry-confidence-event", {
        telemetryId: input.telemetryId,
        volatile,
      }),
      createdAt: input.createdAt,
    }),
    record: Object.freeze({
      confidenceId: `${input.telemetryId}:confidence-record`,
      sourceId: input.constitutionalAuditEpisodeResult.record.simulationId,
      volatilityDetected: volatile,
      deterministicHash: hashTelemetryValue("telemetry-confidence-record", {
        telemetryId: input.telemetryId,
        volatile,
      }),
    }),
    errors: volatile
      ? Object.freeze([
        Object.freeze({
          code: "ADVERSARIAL_TELEMETRY_CONFIDENCE_VOLATILITY" as const,
          message: "Confidence manipulation or collapse chains detected.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
    volatilityScore: volatile ? 1 : 0,
  });
}
