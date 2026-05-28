import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceAuditEntry,
  ConfidenceLedgerEvent,
  DeterministicConfidenceLedgerEntry,
} from "./types/confidenceTypes";

export function buildConfidenceAuditEntry(input: {
  confidenceId: string;
  proposalId: string;
  eventType: ConfidenceLedgerEvent;
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
}): ConfidenceAuditEntry {
  const entryHash = hashConfidenceValue("confidence-audit-entry", {
    confidenceId: input.confidenceId,
    proposalId: input.proposalId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditEntryId: `${input.confidenceId}:${input.eventType}`,
    confidenceId: input.confidenceId,
    proposalId: input.proposalId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash,
    entryHash,
    appendOnly: true as const,
    replayCompatible: true as const,
    authorityGranted: false as const,
    executionPermitted: false as const,
    operatorReviewRequired: true as const,
  });
}

export function appendConfidenceAuditEntry(input: {
  existing: readonly DeterministicConfidenceLedgerEntry[];
  entry: ConfidenceAuditEntry;
}): readonly DeterministicConfidenceLedgerEntry[] {
  const ledgerEntry = appendImmutableLedgerEntry({
    payload: Object.freeze(input.entry),
    previousHash: input.existing.at(-1)?.entryHash ?? null,
    scope: "confidence-engine",
  });

  return Object.freeze([...input.existing, ledgerEntry]);
}
