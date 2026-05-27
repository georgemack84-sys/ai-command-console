import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { applyProposalLineageTransition, buildInitialProposalLineage } from "./lifecycleLineageRegistry";
import { buildGovernanceBindingRecord } from "./governanceBindingRegistry";
import { buildProposalStateAuditRecord, appendProposalStateAuditEntry } from "./proposalStateAuditLog";
import { validateProposalStateDeterminism } from "./proposalStateDeterminismValidator";
import { buildProposalStateFreezeRecord } from "./proposalStateFailClosedGuard";
import { validateProposalTransition } from "./proposalTransitionValidator";
import { hashProposalTransitionValue } from "./proposalTransitionHasher";
import { validateProposalReplayAdmissibility } from "./proposalReplayAdmissibilityValidator";
import type {
  ProposalLifecycleLineage,
  ProposalStateAuditRecord,
  ProposalStateEngineInput,
  ProposalStateEngineResult,
  ProposalStateError,
  ProposalStateStageRecord,
  ProposalTransitionResult,
} from "./types/proposalStateTypes";

function buildStages(errors: readonly ProposalStateError[]): readonly ProposalStateStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "transition_validation",
    "governance_binding",
    "replay_admissibility",
    "lineage_registry",
    "audit_append",
    "determinism_validation",
    "fail_closed",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashProposalTransitionValue("proposal-state-stage", { stage, reasons }),
  })));
}

function buildTransitionResult(input: {
  accepted: boolean;
  rejectionCode?: ProposalStateError["code"];
  resultingState?: ProposalTransitionResult["resultingState"];
  transition: ProposalStateEngineInput["transition"];
  governanceSnapshotId: string;
  replayLineageId: string;
  auditEventId: string;
}): ProposalTransitionResult {
  return Object.freeze({
    accepted: input.accepted,
    resultingState: input.resultingState,
    rejectionCode: input.rejectionCode,
    transitionId: input.transition.transitionId,
    proposalId: input.transition.proposalId,
    governanceSnapshotId: input.governanceSnapshotId,
    replayLineageId: input.replayLineageId,
    auditEventId: input.auditEventId,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
    transitionInferred: false as const,
  });
}

function buildAuditRecords(input: {
  engineInput: ProposalStateEngineInput;
  accepted: boolean;
  transitionResultHash: string;
}): readonly ProposalStateAuditRecord[] {
  const { transition } = input.engineInput;
  const eventTypes: ProposalStateAuditRecord["eventType"][] = [
    "proposal.state.transition.requested",
    "proposal.state.transition.validated",
    input.accepted ? "proposal.state.transition.applied" : "proposal.state.transition.rejected",
  ];

  if (transition.targetState === "frozen") {
    eventTypes.push("proposal.state.frozen");
  }
  if (transition.targetState === "revoked") {
    eventTypes.push("proposal.state.revoked");
  }
  if (transition.targetState === "disputed") {
    eventTypes.push("proposal.state.disputed");
  }
  if (transition.targetState === "archived") {
    eventTypes.push("proposal.state.archived");
  }

  return Object.freeze(eventTypes.map((eventType, index) => buildProposalStateAuditRecord({
    proposalId: transition.proposalId,
    transitionId: transition.transitionId,
    eventType,
    timestamp: input.engineInput.evaluatedAt,
    inputHash: hashProposalTransitionValue("proposal-state-audit-input", {
      eventType,
      transitionId: transition.transitionId,
      index,
    }),
    outputHash: input.transitionResultHash,
  })));
}

function validateRootInput(input: ProposalStateEngineInput): readonly ProposalStateError[] {
  const errors: ProposalStateError[] = [];
  if (
    !input.stateEngineRunId
    || !input.evaluatedAt
    || !input.governancePolicyVersion
    || !input.constitutionalRuleSetVersion
  ) {
    errors.push({
      code: "PROPOSAL_STATE_AMBIGUOUS_TRANSITION",
      message: "Proposal state evaluation requires deterministic run, governance, and constitutional version identifiers.",
      path: "input",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PROPOSAL_STATE_AUDIT_APPEND_FAILED",
      message: "Existing proposal state audit ledger chain is invalid.",
      path: "existingAuditLedger",
    });
  }
  return Object.freeze(errors);
}

export function evaluateProposalStateTransition(
  input: ProposalStateEngineInput,
): ProposalStateEngineResult {
  const errors: ProposalStateError[] = [...validateRootInput(input)];

  const governanceBindingOutcome = buildGovernanceBindingRecord(input);
  errors.push(...governanceBindingOutcome.errors);

  const replayAdmissibility = validateProposalReplayAdmissibility(input);
  errors.push(...replayAdmissibility.errors);

  errors.push(...validateProposalTransition({
    engineInput: input,
    governanceBinding: governanceBindingOutcome.record,
    replayAdmissibility: replayAdmissibility.record,
  }));

  const initialLineage = input.existingLineage ?? buildInitialProposalLineage({
    proposalId: input.transition.proposalId,
    currentState: input.currentState,
    createdAt: input.proposalIntegrityResult.proposal.createdAt,
  });

  const accepted = errors.length === 0;
  const resultingState = accepted ? input.transition.targetState : undefined;
  const transitionResultSeed = buildTransitionResult({
    accepted,
    rejectionCode: errors[0]?.code,
    resultingState,
    transition: input.transition,
    governanceSnapshotId: input.transition.governanceSnapshotId,
    replayLineageId: replayAdmissibility.record.replayLineageId,
    auditEventId: `${input.transition.transitionId}:${accepted ? "proposal.state.transition.applied" : "proposal.state.transition.rejected"}`,
  });

  const lineage: ProposalLifecycleLineage = accepted
    ? applyProposalLineageTransition({
        existingLineage: initialLineage,
        transition: input.transition,
        resultingState: input.transition.targetState,
        governanceBinding: governanceBindingOutcome.record,
        replayLineageId: replayAdmissibility.record.replayLineageId,
        auditEventId: transitionResultSeed.auditEventId,
        updatedAt: input.evaluatedAt,
      })
    : initialLineage;

  errors.push(...validateProposalStateDeterminism({
    transition: input.transition,
    result: transitionResultSeed,
    lineage,
    governanceBinding: governanceBindingOutcome.record,
  }));

  const freeze = buildProposalStateFreezeRecord(errors);
  const status = freeze.failedClosed
    ? "FAILED_CLOSED"
    : freeze.frozen
      ? "FROZEN"
      : "COMPLETED";

  const transitionResult = buildTransitionResult({
    accepted: accepted && !freeze.failedClosed,
    rejectionCode: errors[0]?.code,
    resultingState: accepted && !freeze.failedClosed ? input.transition.targetState : undefined,
    transition: input.transition,
    governanceSnapshotId: input.transition.governanceSnapshotId,
    replayLineageId: replayAdmissibility.record.replayLineageId,
    auditEventId: transitionResultSeed.auditEventId,
  });

  const transitionResultHash = hashProposalTransitionValue("proposal-state-transition-result", transitionResult);
  const auditRecords = buildAuditRecords({
    engineInput: input,
    accepted: transitionResult.accepted,
    transitionResultHash,
  });

  const auditLedger = auditRecords.reduce<readonly import("./types/proposalStateTypes").ProposalStateAuditLedgerEntry[]>(
    (ledger, record) => appendProposalStateAuditEntry({ existing: ledger, record }),
    input.existingAuditLedger ?? [],
  );

  if (!verifyImmutableLedgerChain([...auditLedger])) {
    errors.push({
      code: "PROPOSAL_STATE_AUDIT_APPEND_FAILED",
      message: "Proposal state audit ledger append did not preserve immutable chain integrity.",
      path: "auditLedger",
    });
  }

  return Object.freeze({
    status,
    transitionResult,
    lineage,
    governanceBinding: governanceBindingOutcome.record,
    replayAdmissibility: replayAdmissibility.record,
    auditRecords,
    auditLedger,
    freeze: buildProposalStateFreezeRecord(errors),
    stages: buildStages(errors),
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      transitionResult.accepted
        ? ["Proposal transition applied deterministically with append-only lineage preservation."]
        : ["Proposal transition failed closed under constitutional state enforcement."],
    ),
    deterministicHash: hashProposalTransitionValue("proposal-state-engine-result", {
      transitionResult,
      lineage,
      governanceBinding: governanceBindingOutcome.record,
      replayAdmissibility: replayAdmissibility.record,
      auditHashes: auditRecords.map((record) => record.entryHash),
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const ProposalStateEngine = evaluateProposalStateTransition;
