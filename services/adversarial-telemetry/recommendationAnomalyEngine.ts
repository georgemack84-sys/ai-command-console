import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  TelemetryError,
} from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function analyzeRecommendationAnomalies(input: ConstitutionalTelemetryInput): Readonly<{
  event: ConstitutionalTelemetryEvent;
  errors: readonly TelemetryError[];
  anomalyRate: number;
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const anomalyDetected = normalized.includes("unsupportedrecommendation")
    || normalized.includes("fabricatedevidence")
    || normalized.includes("abnormalconfidencespikes")
    || normalized.includes("recommendationsuppression");
  return Object.freeze({
    event: Object.freeze({
      telemetryId: `${input.telemetryId}:recommendation`,
      domain: "recommendation",
      severity: anomalyDetected ? "high" : "low",
      sourceId: input.constitutionalAuditEpisodeResult.record.episodeId,
      snapshotId: input.constitutionalAuditEpisodeResult.record.simulationId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      replayLineageHash: input.constitutionalAuditEpisodeResult.hashes.replayHash,
      escalationLineageHash: input.constitutionalAuditEpisodeResult.hashes.escalationHash,
      approvalLineageHash: input.constitutionalAuditEpisodeResult.hashes.approvalHash,
      anomalyDetected,
      escalationRequired: anomalyDetected,
      freezeRequired: false,
      forensicHash: hashTelemetryValue("telemetry-recommendation-event", {
        telemetryId: input.telemetryId,
        anomalyDetected,
      }),
      createdAt: input.createdAt,
    }),
    errors: anomalyDetected
      ? Object.freeze([
        Object.freeze({
          code: "ADVERSARIAL_TELEMETRY_RECOMMENDATION_ANOMALY" as const,
          message: "Unsupported recommendations, fabricated evidence, or suppression detected.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
    anomalyRate: anomalyDetected ? 1 : 0,
  });
}
