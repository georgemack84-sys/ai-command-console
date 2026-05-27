import type {
  AntiEmergenceInput,
  AntiEmergenceResult,
  EmergenceLineageEntry,
} from "./antiEmergenceStateTypes";
import { validateAntiEmergenceInput } from "./antiEmergenceSchemas";
import { runAntiEmergenceSimulation } from "./antiEmergenceSimulationHarness";
import { validateEmergenceReplayBinding } from "./emergenceReplayBindingValidator";
import { validateEmergenceReplay } from "./emergenceReplayValidator";
import { validateEmergenceGovernance } from "./emergenceGovernanceValidator";
import { validateEmergenceContainment, buildContainmentState } from "./emergenceContainmentValidator";
import { enforceEmergenceBoundary } from "./emergenceBoundaryEnforcer";
import { validateEmergenceIsolation } from "./emergenceIsolationLayer";
import { validateHiddenExecution } from "./hiddenExecutionValidator";
import { validateWorkflowSynthesis } from "./workflowSynthesisValidator";
import { validateInvisibleScheduling } from "./invisibleSchedulingValidator";
import { validateTopologyBoundary } from "./topologyBoundaryEngine";
import { validateCoordinationFanout } from "./coordinationFanoutValidator";
import { validateGovernanceDetachment } from "./governanceDetachmentDetector";
import { resolveEmergenceClassification } from "./emergenceFailureCoordinator";
import { bundleEmergenceEvidence } from "./emergenceEvidenceBundler";
import { appendEmergenceLedger, appendEmergenceLineage } from "./emergenceLineageLog";
import { exportEmergenceForensics } from "./emergenceForensicExporter";
import { buildEmergenceIntegrityReport } from "./emergenceIntegrityReporter";
import { scoreContainmentReadiness } from "./containmentReadinessScorer";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function buildAntiEmergenceContainment(
  input: AntiEmergenceInput,
): AntiEmergenceResult {
  const schemaErrors = validateAntiEmergenceInput(input);
  const signals = runAntiEmergenceSimulation(input);
  const replayBinding = validateEmergenceReplayBinding(input);
  const replayErrors = validateEmergenceReplay(input);
  const governanceErrors = validateEmergenceGovernance(input);
  const containmentErrors = validateEmergenceContainment(input);
  const boundaryErrors = enforceEmergenceBoundary(input);
  const isolationErrors = validateEmergenceIsolation(input);
  const hiddenExecutionErrors = validateHiddenExecution(input);
  const workflowErrors = validateWorkflowSynthesis(input);
  const schedulingErrors = validateInvisibleScheduling(input);
  const topologyErrors = validateTopologyBoundary(input);
  const fanoutErrors = validateCoordinationFanout(input);
  const governanceDetachmentErrors = validateGovernanceDetachment(input);

  const errors = Object.freeze([
    ...schemaErrors,
    ...replayBinding.errors,
    ...replayErrors,
    ...governanceErrors,
    ...containmentErrors,
    ...boundaryErrors,
    ...isolationErrors,
    ...hiddenExecutionErrors,
    ...workflowErrors,
    ...schedulingErrors,
    ...topologyErrors,
    ...fanoutErrors,
    ...governanceDetachmentErrors,
  ]);

  const simulatedClassification = scoreContainmentReadiness(signals);
  const classification = resolveEmergenceClassification(errors, signals.some((signal) => signal.triggered)) === "contained"
    ? simulatedClassification
    : resolveEmergenceClassification(errors, signals.some((signal) => signal.triggered));
  const severity = signals.some((signal) => signal.triggered && signal.severity === "critical")
    ? "critical"
    : signals.some((signal) => signal.triggered && signal.severity === "high")
      ? "high"
      : signals.some((signal) => signal.triggered && signal.severity === "moderate")
        ? "moderate"
        : "none";
  const containmentState = buildContainmentState({
    containmentId: input.containmentId,
    classification,
  });
  const evidence = bundleEmergenceEvidence({
    containmentInput: input,
    reasons: Object.freeze(errors.map((item) => item.code)),
  });
  const lineageEntry: EmergenceLineageEntry = Object.freeze({
    entryId: hashEmergenceValue("anti-emergence-lineage-entry-id", {
      containmentId: input.containmentId,
      createdAt: input.createdAt,
    }),
    containmentId: input.containmentId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    classification,
    severity,
    createdAt: input.createdAt,
    deterministicHash: hashEmergenceValue("anti-emergence-lineage-entry", {
      containmentId: input.containmentId,
      classification,
      severity,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendEmergenceLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const primaryLedger = appendEmergenceLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "anti.emergence.evaluated",
      containmentId: input.containmentId,
      classification,
      severity,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "anti-emergence-constitutional-containment",
  });
  const replayLedger = appendEmergenceLedger({
    existing: primaryLedger,
    payload: Object.freeze({
      event: classification === "contained" ? "containment.certified" : "containment.frozen",
      containmentId: input.containmentId,
      classification,
      containmentHash: containmentState.containmentHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "anti-emergence-constitutional-containment-audit",
  });
  const topologySignal = signals.find((signal) => signal.domain === "topology_mutation");
  const forensicExport = exportEmergenceForensics({
    containmentId: input.containmentId,
    evidence,
    lineage,
    containmentState,
    topologyHash: topologySignal?.deterministicHash ?? hashEmergenceValue("anti-emergence-empty-topology", input.containmentId),
  });
  const integrityReport = buildEmergenceIntegrityReport({
    containmentId: input.containmentId,
    classification,
    errors,
    deterministic: input.constitutionalReplayResult.record.replayDeterministic
      && input.humanSupremacyResult.integrityReport.deterministic
      && input.escalationDeterminismResult.integrityReport.deterministic,
  });

  const record = Object.freeze({
    containmentId: input.containmentId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    replayId: input.constitutionalReplayResult.record.replayId,
    supremacyId: input.humanSupremacyResult.record.supremacyId,
    escalationId: input.escalationDeterminismResult.record.escalationId,
    governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReplayResult.record.replaySnapshotId,
    classification,
    severity,
    failClosed: classification !== "contained",
    replaySafe: input.constitutionalReplayResult.record.replayDeterministic,
    governanceBound: replayBinding.replayBinding.governanceBound,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    signals,
    replayBinding: replayBinding.replayBinding,
    containmentState,
    evidence,
    lineage,
    replayLedger,
    forensicExport,
    integrityReport,
    warnings: Object.freeze(classification === "contained"
      ? ["Anti-emergence containment remained replay-safe, deterministic, and non-executing."]
      : ["Anti-emergence containment increased oversight and tightened restriction."]),
    errors,
    deterministicHash: hashEmergenceValue("anti-emergence-result", {
      containmentId: input.containmentId,
      classification,
      severity,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      exportHash: forensicExport.exportHash,
      reportHash: integrityReport.reportHash,
    }),
    derivedOnly: true as const,
  });
}
