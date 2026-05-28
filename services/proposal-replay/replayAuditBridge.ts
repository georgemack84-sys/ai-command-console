import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashProposalReplayValue } from "./replayHasher";
import type { ProposalReplayAuditRecord, ProposalReplayLedgerEntry, ProposalReplayAuditEventType } from "./replayTypes";

export function buildProposalReplayAuditRecord(input: {
  replayId: string;
  proposalId: string;
  eventType: ProposalReplayAuditEventType;
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
}): ProposalReplayAuditRecord {
  const entryHash = hashProposalReplayValue("proposal-replay-audit", {
    replayId: input.replayId,
    proposalId: input.proposalId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditId: `${input.replayId}:${input.eventType}`,
    replayId: input.replayId,
    proposalId: input.proposalId,
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

export function appendProposalReplayAuditEntry(input: {
  existing: readonly ProposalReplayLedgerEntry[];
  record: ProposalReplayAuditRecord;
}): readonly ProposalReplayLedgerEntry[] {
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(input.record),
    previousHash: input.existing.at(-1)?.entryHash ?? null,
    scope: "proposal-replay",
  });

  return Object.freeze([...input.existing, entry]);
}
