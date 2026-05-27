import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashEvidence } from "@/services/audit/evidenceHashing";
import { appendIntentAuditEntry, readIntentAuditEntries } from "./intentPersistence";

export function appendIntentAudit(input: {
  intentId: string;
  eventType: string;
  details: Record<string, unknown>;
}) {
  const previousEntry = readIntentAuditEntries(input.intentId).at(-1);
  const entry = appendImmutableLedgerEntry({
    payload: {
      auditId: `intent-audit:${hashEvidence({
        intentId: input.intentId,
        eventType: input.eventType,
        details: input.details,
      }).slice(0, 16)}`,
      intentId: input.intentId,
      eventType: input.eventType,
      details: JSON.parse(JSON.stringify(input.details)),
    },
    previousHash: previousEntry?.entryHash ?? null,
    scope: "intent-lifecycle",
  });

  appendIntentAuditEntry(input.intentId, entry);
  return entry;
}
