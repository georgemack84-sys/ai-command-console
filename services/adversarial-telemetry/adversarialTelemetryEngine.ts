import type {
  ConstitutionalTelemetryEvent,
  ConstitutionalTelemetryInput,
  ConstitutionalTelemetryResult,
  TelemetryLineageEntry,
  TelemetryMetrics,
  TelemetrySeverity,
} from "@/types/adversarial-telemetry";
import { buildTelemetryAuthorityContract } from "./telemetryContracts";
import { monitorReplayStability } from "./replayStabilityMonitor";
import { detectGovernanceViolations } from "./governanceViolationDetector";
import { analyzeRecommendationAnomalies } from "./recommendationAnomalyEngine";
import { monitorApprovalInstability } from "./approvalInstabilityMonitor";
import { detectEscalationFailures } from "./escalationFailureDetector";
import { analyzeConfidenceVolatility } from "./confidenceVolatilityEngine";
import { monitorContainmentPressure } from "./containmentPressureMonitor";
import { reconstructTelemetryEvents } from "./telemetryReconstructionEngine";
import { classifyTelemetryRisk } from "./telemetryRiskClassifier";
import { appendImmutableTelemetryLedger } from "./immutableTelemetryLedger";
import { appendConstitutionalTelemetryLedger } from "./constitutionalTelemetryLedger";
import { bindTelemetryGovernance } from "./telemetryGovernanceBinder";
import { verifyTelemetryReplay } from "./telemetryReplayVerifier";
import { buildTelemetryEvidence } from "./telemetryEvidenceBuilder";
import { validateTelemetryBoundary } from "./telemetryBoundaryValidator";
import { validateTelemetryIsolation } from "./telemetryIsolationValidator";
import { validateTelemetryContainment } from "./telemetryContainmentValidator";
import { resolveTelemetryState } from "./telemetryFailClosedCoordinator";
import { freezeTelemetryState } from "./telemetryFreezeCoordinator";
import { appendInternalTelemetryLineage } from "./internalTelemetryLineageEngine";
import { hashTelemetryValue } from "./telemetryHashEngine";

const ORDER: Record<TelemetrySeverity, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3,
};

function classifyEventSeverity(events: readonly ConstitutionalTelemetryEvent[]): TelemetrySeverity {
  return events.reduce<TelemetrySeverity>((current, event) =>
    ORDER[event.severity] > ORDER[current] ? event.severity : current, "low");
}

function buildMetrics(input: {
  replayScore: number;
  governanceRate: number;
  recommendationRate: number;
  approvalScore: number;
  escalationRate: number;
  confidenceScore: number;
  containmentScore: number;
  reconstructionSuccess: boolean;
}): TelemetryMetrics {
  return Object.freeze({
    replay_stability_score: input.replayScore,
    governance_violation_rate: input.governanceRate,
    recommendation_anomaly_rate: input.recommendationRate,
    approval_instability_score: input.approvalScore,
    escalation_failure_rate: input.escalationRate,
    confidence_volatility_score: input.confidenceScore,
    containment_pressure_score: input.containmentScore,
    forensic_reconstruction_success_rate: input.reconstructionSuccess ? 1 : 0,
  });
}

export function buildAdversarialTelemetryEngine(
  input: ConstitutionalTelemetryInput,
): ConstitutionalTelemetryResult {
  const authorityContract = buildTelemetryAuthorityContract();
  const replay = monitorReplayStability(input);
  const governance = detectGovernanceViolations(input);
  const recommendation = analyzeRecommendationAnomalies(input);
  const approval = monitorApprovalInstability(input);
  const escalation = detectEscalationFailures(input);
  const confidence = analyzeConfidenceVolatility(input);
  const containment = monitorContainmentPressure(input);
  const boundaryErrors = validateTelemetryBoundary(input);
  const isolationErrors = validateTelemetryIsolation(input);
  const containmentErrors = validateTelemetryContainment(input);

  const events = reconstructTelemetryEvents({
    telemetryInput: input,
    events: Object.freeze([
      replay.event,
      governance.event,
      recommendation.event,
      approval.event,
      escalation.event,
      confidence.event,
      containment.event,
    ]),
  });
  const severity = classifyEventSeverity(events);
  const riskSeverity = classifyTelemetryRisk(events);
  const errors = Object.freeze([
    ...replay.errors,
    ...governance.errors,
    ...recommendation.errors,
    ...approval.errors,
    ...escalation.errors,
    ...confidence.errors,
    ...containment.errors,
    ...boundaryErrors,
    ...isolationErrors,
    ...containmentErrors,
  ]);

  const telemetryState = freezeTelemetryState(resolveTelemetryState({
    errors,
    severity,
    inheritedFailClosed: input.constitutionalAuditEpisodeResult.record.failClosed,
  }));

  const governanceBinding = bindTelemetryGovernance(input);
  const replayVerification = verifyTelemetryReplay({
    telemetryInput: input,
    replayStable: replay.score === 1 && errors.every((item) => !item.code.includes("REPLAY")),
  });
  const evidence = buildTelemetryEvidence({
    telemetryInput: input,
    evidenceRefs: Object.freeze([
      input.constitutionalAuditEpisodeResult.evidence.evidenceId,
      ...events.map((event) => event.telemetryId),
    ]),
    reasons: Object.freeze(errors.map((item) => item.code)),
  });

  const lineageEntry: TelemetryLineageEntry = Object.freeze({
    entryId: hashTelemetryValue("telemetry-lineage-entry-id", {
      telemetryId: input.telemetryId,
      createdAt: input.createdAt,
    }),
    telemetryId: input.telemetryId,
    coordinationId: input.constitutionalAuditEpisodeResult.record.coordinationId,
    telemetryState,
    createdAt: input.createdAt,
    deterministicHash: hashTelemetryValue("telemetry-lineage-entry", {
      telemetryId: input.telemetryId,
      telemetryState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendInternalTelemetryLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendImmutableTelemetryLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "telemetry.recorded",
      telemetryId: input.telemetryId,
      telemetryState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "adversarial-telemetry",
  });
  const auditLedger = appendConstitutionalTelemetryLedger({
    existing: replayLedger,
    payload: Object.freeze({
      event: telemetryState === "stable" ? "forensics.reconstructed" : "telemetry.frozen",
      telemetryId: input.telemetryId,
      telemetryState,
      replayVerificationHash: replayVerification.verificationHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "adversarial-telemetry-audit",
  });

  const metrics = buildMetrics({
    replayScore: replay.score,
    governanceRate: governance.violationRate,
    recommendationRate: recommendation.anomalyRate,
    approvalScore: approval.instabilityScore,
    escalationRate: escalation.failureRate,
    confidenceScore: confidence.volatilityScore,
    containmentScore: containment.signal.containmentRiskScore,
    reconstructionSuccess: errors.length === 0,
  });

  const record = Object.freeze({
    telemetryId: input.telemetryId,
    coordinationId: input.constitutionalAuditEpisodeResult.record.coordinationId,
    episodeId: input.constitutionalAuditEpisodeResult.record.episodeId,
    simulationId: input.constitutionalAuditEpisodeResult.record.simulationId,
    governanceSnapshotId: input.constitutionalAuditEpisodeResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalAuditEpisodeResult.record.replaySnapshotId,
    telemetryState,
    replaySafe: replayVerification.replayStable,
    failClosed: telemetryState === "blocked" || telemetryState === "frozen" || telemetryState === "disputed",
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    authorityContract,
    events,
    replayVerification,
    governanceBinding,
    containmentPressure: containment.signal,
    escalationRecords: Object.freeze([escalation.record]),
    approvalRecords: Object.freeze([approval.record]),
    confidenceRecords: Object.freeze([confidence.record]),
    evidence,
    lineage,
    replayLedger: auditLedger,
    metrics,
    errors,
    warnings: Object.freeze(riskSeverity === "moderate" ? ["Telemetry recorded elevated but non-freezing pressure."] : []),
    deterministicHash: hashTelemetryValue("adversarial-telemetry-final-result", {
      telemetryId: input.telemetryId,
      telemetryState,
      metrics,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      replayVerificationHash: replayVerification.verificationHash,
    }),
    derivedOnly: true as const,
  });
}

export const detectAdversarialTelemetry = buildAdversarialTelemetryEngine;
