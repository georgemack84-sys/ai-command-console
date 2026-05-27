import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashProposalFreezeValue } from "./proposalFreezeHasher";
import type {
  ProposalFreezeAuditLedgerEntry,
  ProposalFreezeAuditRecord,
  ProposalFreezeEvent,
} from "./types/proposalFreezeTypes";

export function buildProposalFreezeAuditRecord(input: {
  freezeId: string;
  proposalId: string;
  eventType: ProposalFreezeEvent["eventType"];
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
}): ProposalFreezeAuditRecord {
  const entryHash = hashProposalFreezeValue("proposal-freeze-audit-record", {
    freezeId: input.freezeId,
    proposalId: input.proposalId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditId: `${input.freezeId}:${input.eventType}`,
    freezeId: input.freezeId,
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

export function appendProposalFreezeAuditEntry(input: {
  existing: readonly ProposalFreezeAuditLedgerEntry[];
  record: ProposalFreezeAuditRecord;
}): readonly ProposalFreezeAuditLedgerEntry[] {
  const previousHash = input.existing.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(input.record),
    previousHash,
    scope: "proposal-freeze-layer",
  });
  return Object.freeze([...input.existing, entry]);
}
