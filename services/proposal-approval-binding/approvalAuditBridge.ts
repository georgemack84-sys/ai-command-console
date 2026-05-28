import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  ApprovalAuditEntry,
  ApprovalAuditEventType,
  ProposalApprovalBindingLedgerEntry,
} from "./types/proposalApprovalBindingTypes";
import { hashApprovalValue } from "./approvalHashEngine";

export function buildApprovalAuditEntry(input: {
  proposalId: string;
  bindingId: string;
  eventType: ApprovalAuditEventType;
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
}): ApprovalAuditEntry {
  const entryHash = hashApprovalValue("proposal-approval-audit", {
    proposalId: input.proposalId,
    bindingId: input.bindingId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditEntryId: `${input.bindingId}:${input.eventType}`,
    proposalId: input.proposalId,
    bindingId: input.bindingId,
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

export function appendApprovalAuditEntry(input: {
  existing: readonly ProposalApprovalBindingLedgerEntry[];
  record: ApprovalAuditEntry;
}): readonly ProposalApprovalBindingLedgerEntry[] {
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(input.record),
    previousHash: input.existing.at(-1)?.entryHash ?? null,
    scope: "proposal-approval-binding",
  });

  return Object.freeze([...input.existing, entry]);
}
