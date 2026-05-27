import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashGovernanceBindingValue } from "./governanceBindingHasher";
import type { GovernanceBindingAuditLedgerEntry, GovernanceBindingAuditRecord, GovernanceLineageEvent } from "./governanceBindingTypes";

export function buildGovernanceBindingAuditRecord(input: {
  bindingId: string;
  proposalId: string;
  eventType: GovernanceLineageEvent["eventType"];
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
}): GovernanceBindingAuditRecord {
  const entryHash = hashGovernanceBindingValue("proposal-governance-binding-audit", {
    bindingId: input.bindingId,
    proposalId: input.proposalId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditId: `${input.bindingId}:${input.eventType}`,
    bindingId: input.bindingId,
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

export function appendGovernanceBindingAuditEntry(input: {
  existing: readonly GovernanceBindingAuditLedgerEntry[];
  record: GovernanceBindingAuditRecord;
}): readonly GovernanceBindingAuditLedgerEntry[] {
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(input.record),
    previousHash: input.existing.at(-1)?.entryHash ?? null,
    scope: "proposal-governance-binding",
  });
  return Object.freeze([...input.existing, entry]);
}
