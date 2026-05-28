import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  ContainmentPressureSignal,
  TelemetryError,
} from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function monitorContainmentPressure(input: ConstitutionalTelemetryInput): Readonly<{
  event: ConstitutionalTelemetryEvent;
  signal: ContainmentPressureSignal;
  errors: readonly TelemetryError[];
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const recursivePressure = normalized.includes("recursivecoordinationpressure") ? 1 : 0;
  const orchestrationPressure = normalized.includes("hiddenorchestrationpressure") ? 1 : 0;
  const authorityExpansionPressure = normalized.includes("authorityexpansionpressure") || normalized.includes("syntheticauthorityinjection") ? 1 : 0;
  const replayInstabilityPressure = normalized.includes("replayinstabilitypressure") || !input.constitutionalAuditEpisodeResult.record.replaySafe ? 1 : 0;
  const escalationSuppressionPressure = normalized.includes("escalationsuppressionpressure") ? 1 : 0;
  const containmentRiskScore = (recursivePressure + orchestrationPressure + authorityExpansionPressure + replayInstabilityPressure + escalationSuppressionPressure) / 5;
  const anomalyDetected = containmentRiskScore > 0;
  const signal: ContainmentPressureSignal = Object.freeze({
    signalId: `${input.telemetryId}:containment-signal`,
    recursivePressure,
    orchestrationPressure,
    authorityExpansionPressure,
    replayInstabilityPressure,
    escalationSuppressionPressure,
    containmentRiskScore,
    escalationRequired: anomalyDetected,
    freezeRecommended: containmentRiskScore >= 0.4,
    createdAt: input.createdAt,
  });
  return Object.freeze({
    event: Object.freeze({
      telemetryId: `${input.telemetryId}:containment`,
      domain: "containment",
      severity: containmentRiskScore >= 0.4 ? "critical" : anomalyDetected ? "high" : "low",
      sourceId: input.constitutionalAuditEpisodeResult.record.episodeId,
      snapshotId: input.constitutionalAuditEpisodeResult.record.simulationId,
      governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
      replayLineageHash: input.constitutionalAuditEpisodeResult.hashes.replayHash,
      escalationLineageHash: input.constitutionalAuditEpisodeResult.hashes.escalationHash,
      approvalLineageHash: input.constitutionalAuditEpisodeResult.hashes.approvalHash,
      anomalyDetected,
      escalationRequired: signal.escalationRequired,
      freezeRequired: signal.freezeRecommended,
      forensicHash: hashTelemetryValue("telemetry-containment-event", signal),
      createdAt: input.createdAt,
    }),
    signal,
    errors: anomalyDetected
      ? Object.freeze([
        Object.freeze({
          code: "ADVERSARIAL_TELEMETRY_CONTAINMENT_PRESSURE" as const,
          message: "Containment pressure indicates recursive, orchestration, authority, replay, or escalation strain.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
  });
}
