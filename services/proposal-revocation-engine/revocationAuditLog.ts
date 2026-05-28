import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import type { ProposalRevocationAuditLedgerEntry, RevocationAuditEntry } from "./proposalRevocationTypes";

export function buildRevocationAuditEntry(input: {
  revocationId: string;
  proposalId: string;
  eventType: RevocationAuditEntry["eventType"];
  timestamp: string;
  inputHash: string;
  outputHash?: string;
  previousAuditHash?: string;
}): RevocationAuditEntry {
  const auditHash = hashProposalRevocationValue("proposal-revocation-audit-entry", {
    revocationId: input.revocationId,
    proposalId: input.proposalId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash ?? null,
    previousAuditHash: input.previousAuditHash ?? null,
  });

  return Object.freeze({
    auditEntryId: `${input.revocationId}:${input.eventType}`,
    revocationId: input.revocationId,
    proposalId: input.proposalId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousAuditHash: input.previousAuditHash,
    auditHash,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
  });
}

export function appendRevocationAuditLedger(input: {
  existing: readonly ProposalRevocationAuditLedgerEntry[];
  entry: RevocationAuditEntry;
}): readonly ProposalRevocationAuditLedgerEntry[] {
  const next = appendImmutableLedgerEntry({
    payload: Object.freeze(input.entry),
    previousHash: input.existing.at(-1)?.entryHash ?? null,
    scope: "proposal-revocation-engine",
  });
  return Object.freeze([...input.existing, next]);
}
