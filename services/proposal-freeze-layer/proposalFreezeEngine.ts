import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { appendFreezeLineage } from "./freezeLineageLog";
import { validateFreezeTriggers } from "./freezeTriggerValidator";
import { buildProposalFreezeAuditRecord, appendProposalFreezeAuditEntry } from "./proposalFreezeAuditBridge";
import { validateProposalFreezeApprovals } from "./proposalFreezeApprovalValidator";
import { canonicalizeProposalFreezeToString } from "./proposalFreezeCanonicalizer";
import { validateProposalFreezeDependencies } from "./proposalFreezeDependencyValidator";
import { validateProposalFreezeDeterminism } from "./proposalFreezeDeterminismValidator";
import { resolveProposalFreezeState } from "./proposalFreezeFailClosedGuard";
import { validateProposalFreezeGovernance } from "./proposalFreezeGovernanceValidator";
import { hashProposalFreezeValue } from "./proposalFreezeHasher";
import { propagateProposalFreeze } from "./proposalFreezePropagationCoordinator";
import { validateProposalFreezeReplay } from "./proposalFreezeReplayValidator";
import { validateProposalFreezeState } from "./proposalFreezeStateGuard";
import type {
  ProposalFreezeAuditRecord,
  ProposalFreezeError,
  ProposalFreezeEvent,
  ProposalFreezeInput,
  ProposalFreezeRecord,
  ProposalFreezeResult,
  ProposalFreezeSnapshotRecord,
  ProposalFreezeStageRecord,
} from "./types/proposalFreezeTypes";

function buildStages(errors: readonly ProposalFreezeError[]): readonly ProposalFreezeStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "freeze_trigger_validation",
    "replay_validation",
    "governance_validation",
    "dependency_validation",
    "approval_validation",
    "state_guard",
    "freeze_propagation",
    "lineage_append",
    "audit_append",
    "determinism_validation",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashProposalFreezeValue("proposal-freeze-stage", { stage, reasons }),
  })));
}

function validateRootInput(input: ProposalFreezeInput): ProposalFreezeError[] {
  const errors: ProposalFreezeError[] = [];
  if (!input.freezeRunId || !input.evaluatedAt || !input.constitutionalVersion) {
    errors.push({
      code: "PROPOSAL_FREEZE_FAIL_CLOSED",
      message: "Proposal freeze evaluation requires deterministic run and constitutional version identifiers.",
      path: "input",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PROPOSAL_FREEZE_AUDIT_INCONSISTENCY",
      message: "Existing proposal freeze audit chain is invalid.",
      path: "existingAuditLedger",
    });
  }
  return errors;
}

function buildFreezeRecord(input: {
  proposalFreezeInput: ProposalFreezeInput;
  freezeReason: ProposalFreezeRecord["freezeReason"];
  freezeState: ProposalFreezeRecord["freezeState"];
}): ProposalFreezeRecord {
  const proposal = input.proposalFreezeInput.proposalIntegrityResult.proposal;
  const freezeBasis = {
    proposalId: proposal.proposalId,
    freezeState: input.freezeState,
    freezeReason: input.freezeReason,
    governanceSnapshotId: proposal.governanceSnapshotId,
    replaySnapshotId: proposal.replaySnapshotId,
    evidenceSnapshotIds: [
      input.proposalFreezeInput.constitutionalEnforcementResult.lineage.replaySnapshotId,
      input.proposalFreezeInput.recommendationReplayResult.episodes[0]?.replayHash ?? "",
    ].filter(Boolean),
    approvalSnapshotIds: [input.proposalFreezeInput.proposalIntegrityResult.approvalBinding.approvalHash],
    dependencySnapshotIds: [input.proposalFreezeInput.proposalIntegrityResult.lineageBinding.recommendationLineageHash],
    auditEpisodeIds: [
      input.proposalFreezeInput.proposalStateEngineResult.transitionResult.auditEventId,
      ...input.proposalFreezeInput.immutableRecommendationLedgerResult.auditRecords.map((record) => record.auditId),
    ],
    frozenAt: input.proposalFreezeInput.evaluatedAt,
  };

  return Object.freeze({
    freezeId: input.proposalFreezeInput.existingFreezeRecord?.freezeId
      ?? `proposal-freeze:${proposal.proposalId}:${hashProposalFreezeValue("proposal-freeze-id", freezeBasis).slice(0, 12)}`,
    ...freezeBasis,
    freezeHash: hashProposalFreezeValue("proposal-freeze-record", freezeBasis),
  });
}

function buildFreezeEvents(input: {
  freezeRecord: ProposalFreezeRecord;
  proposalId: string;
  createdAt: string;
}): readonly ProposalFreezeEvent[] {
  const eventTypes: readonly ProposalFreezeEvent["eventType"][] = input.freezeRecord.freezeState === "ACTIVE"
    ? Object.freeze(["FREEZE_VALIDATED", "FREEZE_AUDITED"])
    : Object.freeze(["FREEZE_TRIGGERED", "FREEZE_PROPAGATED", "FREEZE_VALIDATED", "FREEZE_REPLAYED", "FREEZE_AUDITED"]);

  return Object.freeze(eventTypes.map((eventType, index) => Object.freeze({
    freezeEventId: `${input.freezeRecord.freezeId}:${eventType}:${index + 1}`,
    proposalId: input.proposalId,
    eventType,
    freezeReason: input.freezeRecord.freezeReason,
    governanceHash: hashProposalFreezeValue("proposal-freeze-governance-event", {
      governanceSnapshotId: input.freezeRecord.governanceSnapshotId,
      eventType,
    }),
    replayHash: hashProposalFreezeValue("proposal-freeze-replay-event", {
      replaySnapshotId: input.freezeRecord.replaySnapshotId,
      eventType,
    }),
    lineageHash: hashProposalFreezeValue("proposal-freeze-lineage-event", {
      evidenceSnapshotIds: input.freezeRecord.evidenceSnapshotIds,
      approvalSnapshotIds: input.freezeRecord.approvalSnapshotIds,
      dependencySnapshotIds: input.freezeRecord.dependencySnapshotIds,
      eventType,
    }),
    createdAt: input.createdAt,
  })));
}

function buildSnapshots(input: {
  proposalId: string;
  freezeRecord: ProposalFreezeRecord;
  freezeEvents: readonly ProposalFreezeEvent[];
}): readonly ProposalFreezeSnapshotRecord[] {
  const tableNames = [
    "proposal_freeze_records",
    "proposal_freeze_events",
    "replay_drift_snapshots",
    "governance_mismatch_snapshots",
    "dependency_integrity_snapshots",
    "approval_lineage_snapshots",
    "freeze_audit_snapshots",
  ] as const;

  return Object.freeze(tableNames.map((tableName) => Object.freeze({
    tableName,
    snapshotId: `${tableName}:${input.proposalId}`,
    proposalId: input.proposalId,
    snapshotHash: hashProposalFreezeValue("proposal-freeze-snapshot", {
      tableName,
      proposalId: input.proposalId,
      freezeHash: input.freezeRecord.freezeHash,
      eventHashes: input.freezeEvents.map((event) => event.freezeEventId),
    }),
  })));
}

function buildAuditRecords(input: {
  freezeRecord: ProposalFreezeRecord;
  freezeEvents: readonly ProposalFreezeEvent[];
  evaluatedAt: string;
}): readonly ProposalFreezeAuditRecord[] {
  return Object.freeze(input.freezeEvents.map((event, index) => buildProposalFreezeAuditRecord({
    freezeId: input.freezeRecord.freezeId,
    proposalId: input.freezeRecord.proposalId,
    eventType: event.eventType,
    timestamp: input.evaluatedAt,
    inputHash: hashProposalFreezeValue("proposal-freeze-audit-input", {
      eventType: event.eventType,
      freezeId: input.freezeRecord.freezeId,
      index,
    }),
    outputHash: event.lineageHash,
  })));
}

export function freezeProposal(
  input: ProposalFreezeInput,
): ProposalFreezeResult {
  const errors: ProposalFreezeError[] = [...validateRootInput(input)];
  const replayErrors = validateProposalFreezeReplay(input);
  errors.push(...replayErrors.errors);
  errors.push(
    ...validateProposalFreezeGovernance(input),
    ...validateProposalFreezeDependencies(input),
    ...validateProposalFreezeApprovals(input),
    ...validateProposalFreezeState(input),
  );

  const triggers = validateFreezeTriggers(input);
  errors.push(...triggers.errors);

  const freezeState = resolveProposalFreezeState({
    errors,
    existingFreezeState: input.existingFreezeRecord?.freezeState,
    permanentFreezeRequired: triggers.permanentFreezeRequired,
  });

  const freezeRecord = buildFreezeRecord({
    proposalFreezeInput: input,
    freezeReason: triggers.freezeReason,
    freezeState,
  });
  const freezeEvents = buildFreezeEvents({
    freezeRecord,
    proposalId: freezeRecord.proposalId,
    createdAt: input.evaluatedAt,
  });
  const propagation = propagateProposalFreeze({
    proposalId: freezeRecord.proposalId,
    freezeRecord,
  });
  const lineage = appendFreezeLineage({
    proposalId: freezeRecord.proposalId,
    existing: input.existingLineage,
    freezeRecord,
    freezeEvents,
    createdAt: input.evaluatedAt,
  });
  errors.push(...validateProposalFreezeDeterminism({
    freezeRecord,
    freezeEvents,
    lineage,
  }));

  const auditRecords = buildAuditRecords({
    freezeRecord,
    freezeEvents,
    evaluatedAt: input.evaluatedAt,
  });
  const auditLedger = auditRecords.reduce<readonly import("./types/proposalFreezeTypes").ProposalFreezeAuditLedgerEntry[]>(
    (ledger, record) => appendProposalFreezeAuditEntry({ existing: ledger, record }),
    input.existingAuditLedger ?? [],
  );

  if (!verifyImmutableLedgerChain([...auditLedger])) {
    errors.push({
      code: "PROPOSAL_FREEZE_AUDIT_INCONSISTENCY",
      message: "Proposal freeze audit append did not preserve immutable chain integrity.",
      path: "auditLedger",
    });
  }

  const snapshots = buildSnapshots({
    proposalId: freezeRecord.proposalId,
    freezeRecord,
    freezeEvents,
  });
  const finalState = resolveProposalFreezeState({
    errors,
    existingFreezeState: freezeState,
    permanentFreezeRequired: triggers.permanentFreezeRequired,
  });
  const status = errors.length > 0 && finalState === "ACTIVE"
    ? "FAILED_CLOSED"
    : finalState;

  return Object.freeze({
    status,
    freezeRecord: Object.freeze({
      ...freezeRecord,
      freezeState: finalState,
    }),
    freezeEvents,
    propagation,
    lineage,
    snapshots,
    auditRecords,
    auditLedger,
    stages: buildStages(errors),
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      finalState === "ACTIVE"
        ? ["Proposal remained active after deterministic freeze validation found no instability."]
        : ["Proposal freeze layer contained the proposal under immutable fail-closed quarantine."],
    ),
    deterministicHash: hashProposalFreezeValue("proposal-freeze-result", canonicalizeProposalFreezeToString({
      freezeRecord,
      freezeEvents,
      propagation,
      lineage,
      snapshotHashes: snapshots.map((snapshot) => snapshot.snapshotHash),
      auditHashes: auditRecords.map((record) => record.entryHash),
      errorCodes: errors.map((error) => error.code),
    })),
    derivedOnly: true as const,
  });
}

export const ProposalFreezeEngine = freezeProposal;
