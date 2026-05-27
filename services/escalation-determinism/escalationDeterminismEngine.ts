import type {
  EscalationDeterminismInput,
  EscalationDeterminismResult,
  EscalationLineageEntry,
} from "./escalationStateTypes";
import { validateEscalationDeterminismInput } from "./escalationSchemas";
import { classifyEscalationUncertainty } from "./uncertaintyClassifier";
import { buildOversightTrigger } from "./oversightTriggerEngine";
import { validateEscalationReplayBinding } from "./escalationReplayBindingValidator";
import { validateEscalationReplay } from "./escalationReplayValidator";
import { validateEscalationGovernance } from "./escalationGovernanceValidator";
import { validateEscalationContainment } from "./escalationContainmentValidator";
import { enforceEscalationBoundary } from "./escalationBoundaryEnforcer";
import { detectEscalationDrift } from "./escalationDriftDetector";
import { validateEscalationDeterminism } from "./escalationDeterminismValidator";
import { validateEscalationIsolation } from "./escalationIsolationLayer";
import { validateEscalationSupremacy } from "./escalationSupremacyValidator";
import { resolveEscalationOversightState } from "./escalationFailureCoordinator";
import { bundleEscalationEvidence } from "./escalationEvidenceBundler";
import { appendEscalationLedger, appendEscalationLineage } from "./escalationLineageLog";
import { exportEscalationForensics } from "./escalationForensicExporter";
import { buildEscalationIntegrityReport } from "./escalationIntegrityReporter";
import { hashEscalationValue } from "./escalationHashingEngine";

export function buildEscalationDeterminism(
  input: EscalationDeterminismInput,
): EscalationDeterminismResult {
  const schemaErrors = validateEscalationDeterminismInput(input);
  const signals = classifyEscalationUncertainty(input);
  const oversightTrigger = buildOversightTrigger({
    escalationId: input.escalationId,
    signals,
  });
  const replayBinding = validateEscalationReplayBinding(input);
  const replayErrors = validateEscalationReplay(input);
  const governanceErrors = validateEscalationGovernance(input);
  const containmentErrors = validateEscalationContainment(input);
  const boundaryErrors = enforceEscalationBoundary(input);
  const driftErrors = detectEscalationDrift(input);
  const determinismErrors = validateEscalationDeterminism(input);
  const isolationErrors = validateEscalationIsolation(input);
  const supremacyErrors = validateEscalationSupremacy(input);

  const errors = Object.freeze([
    ...schemaErrors,
    ...replayBinding.errors,
    ...replayErrors,
    ...governanceErrors,
    ...containmentErrors,
    ...boundaryErrors,
    ...driftErrors,
    ...determinismErrors,
    ...isolationErrors,
    ...supremacyErrors,
  ]);

  const oversightState = resolveEscalationOversightState(errors, oversightTrigger.oversightState);
  const severity = signals.some((signal) => signal.severity === "critical")
    ? "critical"
    : signals.some((signal) => signal.severity === "high")
      ? "high"
      : signals.some((signal) => signal.severity === "elevated")
        ? "elevated"
        : "none";
  const evidence = bundleEscalationEvidence({
    escalationInput: input,
    reasons: Object.freeze(errors.map((item) => item.code)),
  });

  const lineageEntry: EscalationLineageEntry = Object.freeze({
    entryId: hashEscalationValue("escalation-determinism-lineage-entry-id", {
      escalationId: input.escalationId,
      createdAt: input.createdAt,
    }),
    escalationId: input.escalationId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    oversightState,
    severity,
    createdAt: input.createdAt,
    deterministicHash: hashEscalationValue("escalation-determinism-lineage-entry", {
      escalationId: input.escalationId,
      oversightState,
      severity,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendEscalationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const primaryLedger = appendEscalationLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "escalation.determinism.evaluated",
      escalationId: input.escalationId,
      oversightState,
      severity,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "escalation-determinism",
  });
  const replayLedger = appendEscalationLedger({
    existing: primaryLedger,
    payload: Object.freeze({
      event: oversightState === "stable" ? "escalation.verified" : "escalation.oversight.amplified",
      escalationId: input.escalationId,
      oversightState,
      triggerHash: oversightTrigger.triggerHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "escalation-determinism-audit",
  });
  const forensicExport = exportEscalationForensics({
    escalationId: input.escalationId,
    evidence,
    lineage,
    oversightTrigger,
    replayHash: input.constitutionalReplayResult.deterministicHash,
  });
  const integrityReport = buildEscalationIntegrityReport({
    escalationId: input.escalationId,
    oversightState,
    errors,
    deterministic: determinismErrors.length === 0,
  });

  const record = Object.freeze({
    escalationId: input.escalationId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    replayId: input.constitutionalReplayResult.record.replayId,
    supremacyId: input.humanSupremacyResult.record.supremacyId,
    governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReplayResult.record.replaySnapshotId,
    oversightState,
    severity,
    failClosed: oversightState !== "stable",
    replaySafe: input.constitutionalReplayResult.record.replayDeterministic,
    governanceBound: replayBinding.replayBinding.governanceBound,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    uncertaintySignals: signals,
    oversightTrigger: Object.freeze({
      ...oversightTrigger,
      oversightState,
    }),
    replayBinding: replayBinding.replayBinding,
    evidence,
    lineage,
    replayLedger,
    forensicExport,
    integrityReport,
    warnings: Object.freeze(oversightState === "stable"
      ? ["Escalation determinism remained replay-safe, governance-bound, and non-executing."]
      : ["Escalation determinism increased oversight and tightened containment."]),
    errors,
    deterministicHash: hashEscalationValue("escalation-determinism-result", {
      escalationId: input.escalationId,
      oversightState,
      severity,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      exportHash: forensicExport.exportHash,
      reportHash: integrityReport.reportHash,
    }),
    derivedOnly: true as const,
  });
}
