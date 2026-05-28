import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashProposalTransitionValue } from "./proposalTransitionHasher";
import type {
  ProposalStateAuditEventType,
  ProposalStateAuditLedgerEntry,
  ProposalStateAuditRecord,
} from "./types/proposalStateTypes";

export function buildProposalStateAuditRecord(input: {
  proposalId: string;
  transitionId: string;
  eventType: ProposalStateAuditEventType;
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
}): ProposalStateAuditRecord {
  const entryHash = hashProposalTransitionValue("proposal-state-audit-record", {
    proposalId: input.proposalId,
    transitionId: input.transitionId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditEventId: `${input.transitionId}:${input.eventType}`,
    proposalId: input.proposalId,
    transitionId: input.transitionId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash,
    entryHash,
    appendOnly: true as const,
    replayCompatible: true as const,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
    operatorReviewRequired: true as const,
  });
}

export function appendProposalStateAuditEntry(input: {
  existing: readonly ProposalStateAuditLedgerEntry[];
  record: ProposalStateAuditRecord;
}): readonly ProposalStateAuditLedgerEntry[] {
  const previousHash = input.existing.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(input.record),
    previousHash,
    scope: "proposal-state-engine",
  });
  return Object.freeze([...input.existing, entry]);
}
