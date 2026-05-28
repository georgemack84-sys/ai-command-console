import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashConstitutionalValue } from "./constitutionalHashLinker";
import type {
  ConstitutionalAuditEventType,
  ConstitutionalAuditRecord,
  ConstitutionalEnforcementLedgerEntry,
} from "./types/constitutionalEnforcementTypes";

export function buildConstitutionalAuditRecord(input: {
  enforcementRunId: string;
  recommendationId: string;
  eventType: ConstitutionalAuditEventType;
  eventHash: string;
  timestamp: string;
  previousEntryHash?: string;
}): ConstitutionalAuditRecord {
  const entryHash = hashConstitutionalValue("constitutional-enforcement-audit", {
    enforcementRunId: input.enforcementRunId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    eventHash: input.eventHash,
    timestamp: input.timestamp,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditId: `${input.enforcementRunId}:${input.eventType}`,
    enforcementRunId: input.enforcementRunId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    eventHash: input.eventHash,
    timestamp: input.timestamp,
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

export function appendConstitutionalAuditEntry(input: {
  existing: readonly ConstitutionalEnforcementLedgerEntry[];
  record: ConstitutionalAuditRecord;
}): readonly ConstitutionalEnforcementLedgerEntry[] {
  const previousHash = input.existing.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(input.record),
    previousHash,
    scope: "constitutional-enforcement",
  });
  return Object.freeze([...input.existing, entry]);
}
