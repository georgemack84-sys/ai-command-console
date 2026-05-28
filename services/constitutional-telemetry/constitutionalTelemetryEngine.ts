import type {
  ConstitutionalTelemetryInput,
  ConstitutionalTelemetryResult,
  TelemetryLineageEntry,
  TelemetrySeverity,
} from "./telemetryStateTypes";
import { validateConstitutionalTelemetryInput } from "./telemetrySchemas";
import { validateForensicReplayBinding } from "./forensicReplayBindingValidator";
import { validateTelemetryAuthorityFirewall } from "./telemetryAuthorityFirewall";
import { validateTelemetryIsolationBoundary } from "./telemetryIsolationBoundary";
import { detectGovernanceAnomalies } from "./governanceAnomalyDetector";
import { monitorReplayInstability } from "./replayInstabilityMonitor";
import { detectEscalationVolatility } from "./escalationVolatilityDetector";
import { trackOverridePropagation } from "./overridePropagationTracker";
import { analyzeAuthorityPressure } from "./authorityPressureAnalyzer";
import { detectCoordinationDrift } from "./coordinationDriftDetector";
import { monitorContainmentPressure } from "./containmentPressureMonitor";
import { detectRecommendationAnomalies } from "./recommendationAnomalyDetector";
import { validateTelemetryReplay } from "./telemetryReplayValidator";
import { validateTelemetryGovernanceBinding } from "./telemetryGovernanceBindingValidator";
import { validateTelemetryContainment } from "./telemetryContainmentValidator";
import { resolveTelemetryState } from "./observabilityFailClosedCoordinator";
import { bundleConstitutionalTelemetryEvidence } from "./telemetryEvidenceBundler";
import { appendTelemetryLedger, appendTelemetryLineage } from "./immutableTelemetryLineageLog";
import { buildAutonomyForensics } from "./autonomyForensicsEngine";
import { exportTelemetryForensics } from "./telemetryForensicExporter";
import { buildTelemetryIntegrityReport } from "./telemetryIntegrityReporter";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

const ORDER: Record<TelemetrySeverity, number> = {
  none: 0,
  moderate: 1,
  high: 2,
  critical: 3,
};

function severityForEvents(events: readonly { severity: TelemetrySeverity }[]): TelemetrySeverity {
  return events.reduce<TelemetrySeverity>((current, event) =>
    ORDER[event.severity] > ORDER[current] ? event.severity : current, "none");
}

export function buildConstitutionalTelemetry(
  input: ConstitutionalTelemetryInput,
): ConstitutionalTelemetryResult {
  const schemaErrors = validateConstitutionalTelemetryInput(input);
  const replayBinding = validateForensicReplayBinding(input);
  const authorityErrors = validateTelemetryAuthorityFirewall(input);
  const isolationErrors = validateTelemetryIsolationBoundary(input);
  const governance = detectGovernanceAnomalies(input);
  const replay = monitorReplayInstability(input);
  const escalation = detectEscalationVolatility(input);
  const override = trackOverridePropagation(input);
  const authority = analyzeAuthorityPressure(input);
  const coordination = detectCoordinationDrift(input);
  const containment = monitorContainmentPressure(input);
  const recommendation = detectRecommendationAnomalies(input);
  const replayErrors = validateTelemetryReplay(input);
  const governanceErrors = validateTelemetryGovernanceBinding(input);
  const containmentErrors = validateTelemetryContainment(input);

  const events = Object.freeze([
    governance.event,
    replay.event,
    escalation.event,
    override.event,
    authority.event,
    coordination.event,
    containment.event,
    recommendation.event,
  ]);
  const errors = Object.freeze([
    ...schemaErrors,
    ...replayBinding.errors,
    ...authorityErrors,
    ...isolationErrors,
    ...governance.errors,
    ...replay.errors,
    ...escalation.errors,
    ...override.errors,
    ...authority.errors,
    ...coordination.errors,
    ...containment.errors,
    ...recommendation.errors,
    ...replayErrors,
    ...governanceErrors,
    ...containmentErrors,
  ]);

  const telemetryState = resolveTelemetryState({
    errors,
    severity: severityForEvents(events),
    inheritedFailClosed: input.runtimeAdmissibilityResult.record.failClosed,
  });
  const evidence = bundleConstitutionalTelemetryEvidence({
    telemetryInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });
  const forensics = buildAutonomyForensics({
    telemetryInput: input,
    events,
  });
  const lineageEntry: TelemetryLineageEntry = Object.freeze({
    entryId: hashConstitutionalTelemetryValue("constitutional-telemetry-lineage-entry-id", {
      telemetryId: input.telemetryId,
      createdAt: input.createdAt,
    }),
    telemetryId: input.telemetryId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    telemetryState,
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-lineage-entry", {
      telemetryId: input.telemetryId,
      telemetryState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendTelemetryLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const primaryLedger = appendTelemetryLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "constitutional.telemetry.recorded",
      telemetryId: input.telemetryId,
      telemetryState,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-telemetry",
  });
  const replayLedger = appendTelemetryLedger({
    existing: primaryLedger,
    payload: Object.freeze({
      event: telemetryState === "stable" ? "constitutional.forensics.reconstructed" : "constitutional.telemetry.restricted",
      telemetryId: input.telemetryId,
      telemetryState,
      correlationHash: forensics.correlation.correlationHash,
      timelineHash: forensics.timeline.timelineHash,
    }),
    scope: "constitutional-telemetry-audit",
  });
  const forensicExport = exportTelemetryForensics({
    telemetryId: input.telemetryId,
    evidence,
    lineage,
    correlation: forensics.correlation,
    timeline: forensics.timeline,
  });
  const integrityReport = buildTelemetryIntegrityReport({
    telemetryId: input.telemetryId,
    telemetryState,
    errors,
    deterministic: replayBinding.replayBinding.replayBound,
  });

  return Object.freeze({
    record: Object.freeze({
      telemetryId: input.telemetryId,
      coordinationId: input.constitutionalReplayResult.record.coordinationId,
      replayId: input.constitutionalReplayResult.record.replayId,
      supremacyId: input.humanSupremacyResult.record.supremacyId,
      escalationId: input.escalationDeterminismResult.record.escalationId,
      containmentId: input.antiEmergenceResult.record.containmentId,
      admissibilityId: input.runtimeAdmissibilityResult.record.admissibilityId,
      governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
      replaySnapshotId: input.constitutionalReplayResult.record.replaySnapshotId,
      telemetryState,
      replaySafe: replayBinding.replayBinding.replayBound,
      failClosed: telemetryState !== "stable",
      createdAt: input.createdAt,
    }),
    replayBinding: replayBinding.replayBinding,
    events,
    correlation: forensics.correlation,
    timeline: forensics.timeline,
    evidence,
    lineage,
    replayLedger,
    forensicExport,
    integrityReport,
    warnings: Object.freeze(telemetryState === "stable"
      ? ["Constitutional telemetry remained advisory-only, replay-safe, and governance-bound."]
      : ["Constitutional telemetry increased visibility while tightening observability restrictions."]),
    errors,
    deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-result", {
      telemetryId: input.telemetryId,
      telemetryState,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      exportHash: forensicExport.exportHash,
      reportHash: integrityReport.reportHash,
    }),
    derivedOnly: true as const,
  });
}
