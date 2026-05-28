import type { HumanSupremacyInput, HumanSupremacyRecord, InterventionLedgerEntry, InterventionSnapshot } from "@/types/human-supremacy";
import { validateAuthorityBoundary, buildHumanSupremacyAuthorityContract, createHumanSupremacyError } from "./authorityBoundaryValidator";
import { inspectRationale } from "@/services/inspection/rationaleInspectionEngine";
import { inspectGovernanceLineage } from "@/services/inspection/governanceInspectionEngine";
import { inspectReplayLineage } from "@/services/inspection/replayLineageInspector";
import { inspectEscalationLineage } from "@/services/inspection/escalationLineageInspector";
import { inspectConfidenceLineage } from "@/services/inspection/confidenceLineageInspector";
import { buildCoordinationOverride } from "./coordinationOverrideEngine";
import { buildEmergencyFreeze } from "./emergencyFreezeSystem";
import { resolveInterventionState } from "./coordinationInterruptController";
import { resolveFreezeState } from "./freezeStateManager";
import { appendInterventionLedger } from "./interventionAppendOnlyLedger";
import { hashInterventionValue } from "./interventionHasher";
import { inspectOverrideDeterminism } from "./overrideDeterminismInspector";

export function enforceHumanSupremacy(input: HumanSupremacyInput): HumanSupremacyRecord {
  const authorityContract = buildHumanSupremacyAuthorityContract();
  const boundaryErrors = validateAuthorityBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const rationaleInspection = inspectRationale({
    coordinationId: input.coordinationId,
    operatorReason: input.reason,
    missionGraph: input.missionGraph,
  });
  const governanceInspection = inspectGovernanceLineage({
    coordinationId: input.coordinationId,
    proposal: input.proposal,
    lifecycle: input.lifecycle,
  });
  const replayInspection = inspectReplayLineage({
    coordinationId: input.coordinationId,
    proposal: input.proposal,
    lifecycle: input.lifecycle,
    escalationRecord: input.escalationRecord,
  });
  const escalationInspection = inspectEscalationLineage({
    coordinationId: input.coordinationId,
    escalationRecord: input.escalationRecord,
  });
  const confidenceInspection = inspectConfidenceLineage({
    coordinationId: input.coordinationId,
    escalationRecord: input.escalationRecord,
  });
  const overrideResult = buildCoordinationOverride({
    coordinationId: input.coordinationId,
    overrideType: input.overrideType,
    operatorId: input.operatorId,
    action: input.action,
    reason: input.reason,
    replayLineageId: replayInspection.replayLineageId,
    governanceLineageId: governanceInspection.governanceLineageId,
    rationaleSnapshotId: rationaleInspection.rationaleSnapshotId,
    timestamp: input.createdAt,
  });
  const freezeResult = input.action === "emergency_freeze" || input.action === "freeze_escalation"
    ? buildEmergencyFreeze({
      coordinationId: input.coordinationId,
      initiatedBy: input.operatorId,
      reason: input.reason,
      freezeScope: input.action === "freeze_escalation" ? "escalation" : "coordination",
      activatedAt: input.createdAt,
    })
    : Object.freeze({ freeze: undefined, errors: Object.freeze([] as const) });

  const ancestryErrors = [
    ...(input.missionGraph.visibilityState === "frozen"
      ? [createHumanSupremacyError(
        "HUMAN_SUPREMACY_REPLAY_ANCESTRY_MISMATCH",
        "Human supremacy enforcement consumed a frozen mission graph visibility state.",
        "missionGraph.visibilityState",
      )]
      : []),
    ...(!input.escalationRecord.decision.governanceValidated
      ? [createHumanSupremacyError(
        "HUMAN_SUPREMACY_GOVERNANCE_UNCERTAINTY",
        "Human supremacy enforcement requires governance-visible escalation evidence.",
        "escalationRecord.decision.governanceValidated",
      )]
      : []),
    ...(!replayInspection.replaySafe
      ? [createHumanSupremacyError(
        "HUMAN_SUPREMACY_REPLAY_INCONSISTENCY",
        "Human supremacy enforcement requires replay-safe ancestry.",
        "replayInspection",
      )]
      : []),
  ];

  const baseState = resolveInterventionState(input.action);
  const state = resolveFreezeState(freezeResult.freeze) ?? (ancestryErrors.length > 0 ? "fail_closed" : baseState);
  const snapshot: InterventionSnapshot = Object.freeze({
    snapshotId: hashInterventionValue("human-supremacy-snapshot-id", {
      coordinationId: input.coordinationId,
      operatorId: input.operatorId,
      createdAt: input.createdAt,
      state,
    }),
    coordinationId: input.coordinationId,
    state,
    operatorId: input.operatorId,
    overrideActive: Boolean(overrideResult.override),
    freezeActive: Boolean(freezeResult.freeze),
    governanceVisible: true as const,
    replaySafe: true as const,
    createdAt: input.createdAt,
    snapshotHash: "",
  });
  const ledgerEntry: InterventionLedgerEntry = Object.freeze({
    entryId: hashInterventionValue("human-supremacy-ledger-entry", {
      coordinationId: input.coordinationId,
      action: input.action,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    action: input.action,
    overrideId: overrideResult.override?.overrideId,
    freezeId: freezeResult.freeze?.freezeId,
    replayHash: replayInspection.inspectionHash,
    governanceHash: governanceInspection.inspectionHash,
    createdAt: input.createdAt,
  });
  const lineage = appendInterventionLedger({
    existing: input.existingLineage,
    entry: ledgerEntry,
  });
  const provisionalRecord: HumanSupremacyRecord = Object.freeze({
    coordinationId: input.coordinationId,
    state,
    action: input.action,
    authorityContract,
    override: overrideResult.override,
    emergencyFreeze: freezeResult.freeze,
    snapshot: Object.freeze({
      ...snapshot,
      snapshotHash: hashInterventionValue("human-supremacy-snapshot", {
        coordinationId: input.coordinationId,
        state,
        overrideId: overrideResult.override?.overrideId,
        freezeId: freezeResult.freeze?.freezeId,
      }),
    }),
    lineage,
    rationaleInspection,
    governanceInspection,
    replayInspection,
    escalationInspection,
    confidenceInspection,
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...input.lifecycle.warnings,
      ...input.freshnessEvaluation.warnings,
      ...input.escalationRecord.warnings,
      ...input.missionGraph.warnings,
      "Human supremacy enforcement remains deterministic, governance-visible, and non-executing.",
    ]),
    errors: Object.freeze([
      ...boundaryErrors,
      ...overrideResult.errors,
      ...freezeResult.errors,
      ...ancestryErrors,
    ]),
    interventionHash: "",
    derivedOnly: true as const,
  });
  const finalRecord: HumanSupremacyRecord = Object.freeze({
    ...provisionalRecord,
    interventionHash: hashInterventionValue("human-supremacy-record", {
      coordinationId: input.coordinationId,
      state,
      action: input.action,
      overrideId: overrideResult.override?.overrideId,
      freezeId: freezeResult.freeze?.freezeId,
      lineage,
    }),
  });
  return Object.freeze({
    ...finalRecord,
    errors: Object.freeze([
      ...finalRecord.errors,
      ...inspectOverrideDeterminism(finalRecord),
    ]),
  });
}
