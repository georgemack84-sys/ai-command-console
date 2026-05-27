import type {
  HumanSupremacyEnforcementInput,
  HumanSupremacyEnforcementResult,
  SupremacyLineageEntry,
} from "./supremacyStateTypes";
import { validateSupremacyInput } from "./supremacySchemas";
import { validateSupremacyReplayBinding } from "./supremacyReplayBindingValidator";
import { validateSupremacyGovernance } from "./supremacyGovernanceValidator";
import { validateKillSwitchGovernance } from "./killSwitchGovernanceValidator";
import { propagateOperatorOverride } from "./overridePropagationEngine";
import { activateAutonomyFreeze } from "./autonomyFreezeEngine";
import { revokeAuthority } from "./authorityRevocationEngine";
import { revokeEscalation } from "./escalationRevocationEngine";
import { activateKillSwitch } from "./constitutionalKillSwitch";
import { validateFreezeContainment } from "./freezeContainmentValidator";
import { validateSupremacyContainment } from "./supremacyContainmentValidator";
import { validateSupremacyIsolation } from "./supremacyIsolationLayer";
import { enforceSupremacyBoundary } from "./supremacyBoundaryEnforcer";
import { detectSupremacyDrift } from "./supremacyDriftDetector";
import { validateSupremacyDeterminism } from "./supremacyDeterminismValidator";
import { validateOverrideReplay } from "./overrideReplayValidator";
import { validateFreezeReplay } from "./freezeReplayValidator";
import { validateShutdownReplay } from "./shutdownReplayValidator";
import { resolveSupremacyState } from "./supremacyFailureCoordinator";
import { bundleSupremacyEvidence } from "./supremacyEvidenceBundler";
import { appendInterventionLineage } from "./interventionLineageEngine";
import { appendSupremacyAuditLedger } from "./supremacyAuditLedger";
import { appendOperatorInterventionLedger } from "./operatorInterventionAuditLedger";
import { exportSupremacyForensics } from "./supremacyForensicExporter";
import { buildSupremacyIntegrityReport } from "./supremacyIntegrityReporter";
import { buildOperatorInspectionPanel } from "./operatorInspectionPanel";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function enforceHumanSupremacyGrid(
  input: HumanSupremacyEnforcementInput,
): HumanSupremacyEnforcementResult {
  const schemaErrors = validateSupremacyInput(input);
  const replayBinding = validateSupremacyReplayBinding(input);
  const governanceErrors = validateSupremacyGovernance(input);
  const killSwitchGovernanceErrors = validateKillSwitchGovernance(input);
  const override = propagateOperatorOverride(input);
  const freeze = activateAutonomyFreeze(input);
  const authorityRevocation = revokeAuthority(input);
  const escalationRevocation = revokeEscalation(input);
  const killSwitch = activateKillSwitch(input);
  const freezeContainmentErrors = validateFreezeContainment(input);
  const containmentErrors = validateSupremacyContainment(input);
  const isolationErrors = validateSupremacyIsolation(input);
  const boundaryErrors = enforceSupremacyBoundary(input);
  const driftErrors = detectSupremacyDrift(input);
  const determinismErrors = validateSupremacyDeterminism(input);
  const overrideReplayErrors = validateOverrideReplay(input);
  const freezeReplayErrors = validateFreezeReplay(input);
  const shutdownReplayErrors = validateShutdownReplay(input);

  const errors = Object.freeze([
    ...schemaErrors,
    ...replayBinding.errors,
    ...governanceErrors,
    ...killSwitchGovernanceErrors,
    ...override.errors,
    ...freeze.errors,
    ...freezeContainmentErrors,
    ...containmentErrors,
    ...isolationErrors,
    ...boundaryErrors,
    ...driftErrors,
    ...determinismErrors,
    ...overrideReplayErrors,
    ...freezeReplayErrors,
    ...shutdownReplayErrors,
  ]);

  const enforcementState = resolveSupremacyState({
    interventionType: input.interventionType,
    errors,
  });
  const evidence = bundleSupremacyEvidence({
    supremacyInput: input,
    reasons: Object.freeze(errors.map((item) => item.code)),
  });
  const lineageEntry: SupremacyLineageEntry = Object.freeze({
    entryId: hashSupremacyValue("human-supremacy-lineage-entry-id", {
      supremacyId: input.supremacyId,
      createdAt: input.createdAt,
    }),
    supremacyId: input.supremacyId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    interventionType: input.interventionType,
    enforcementState,
    createdAt: input.createdAt,
    deterministicHash: hashSupremacyValue("human-supremacy-lineage-entry", {
      supremacyId: input.supremacyId,
      interventionType: input.interventionType,
      enforcementState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendInterventionLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const supremacyLedger = appendSupremacyAuditLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "human.supremacy.enforced",
      supremacyId: input.supremacyId,
      interventionType: input.interventionType,
      enforcementState,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "human-supremacy-enforcement",
  });
  const replayLedger = appendOperatorInterventionLedger({
    existing: supremacyLedger,
    payload: Object.freeze({
      event: killSwitch.active ? "human.shutdown.activated" : freeze.freeze.active ? "human.freeze.activated" : "human.override.propagated",
      supremacyId: input.supremacyId,
      enforcementState,
      overrideHash: override.overridePropagation.overrideHash,
      freezeHash: freeze.freeze.freezeHash,
      shutdownHash: killSwitch.shutdownHash,
    }),
    scope: "human-supremacy-enforcement-audit",
  });
  const forensicExport = exportSupremacyForensics({
    supremacyId: input.supremacyId,
    evidence,
    lineage,
    overridePropagation: override.overridePropagation,
    freeze: freeze.freeze,
    killSwitch,
  });
  const integrityReport = buildSupremacyIntegrityReport({
    supremacyId: input.supremacyId,
    enforcementState,
    errors,
    deterministic: determinismErrors.length === 0,
  });
  const inspectionPanel = buildOperatorInspectionPanel({
    supremacyId: input.supremacyId,
    operatorId: input.operatorId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    interventionType: input.interventionType,
    enforcementState,
    evidenceHash: evidence.evidenceHash,
  });

  const record = Object.freeze({
    supremacyId: input.supremacyId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    replayId: input.constitutionalReplayResult.record.replayId,
    boundaryId: input.constitutionalReplayResult.record.boundaryId,
    governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReplayResult.record.replaySnapshotId,
    interventionType: input.interventionType,
    enforcementState,
    failClosed: enforcementState !== "ENFORCED",
    replaySafe: input.constitutionalReplayResult.record.replayDeterministic,
    governanceBound: replayBinding.replayBinding.governanceBound,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    replayBinding: replayBinding.replayBinding,
    overridePropagation: override.overridePropagation,
    freeze: freeze.freeze,
    authorityRevocation,
    escalationRevocation,
    killSwitch,
    evidence,
    lineage,
    replayLedger,
    forensicExport,
    integrityReport,
    inspectionPanel,
    warnings: Object.freeze(enforcementState === "ENFORCED"
      ? ["Human supremacy enforcement remained deterministic, replay-safe, and non-executing."]
      : ["Human supremacy enforcement tightened restriction and increased operator visibility."]),
    errors,
    deterministicHash: hashSupremacyValue("human-supremacy-enforcement-result", {
      supremacyId: input.supremacyId,
      interventionType: input.interventionType,
      enforcementState,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      exportHash: forensicExport.exportHash,
      reportHash: integrityReport.reportHash,
    }),
    derivedOnly: true as const,
  });
}
