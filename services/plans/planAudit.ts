import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashEvidence } from "@/services/audit/evidenceHashing";
import { appendPlanAuditEntry, readPlanAuditEntries } from "./planStore";

export function appendPlanAudit(input: {
  planId: string;
  eventType: string;
  details: Record<string, unknown>;
}) {
  const previousEntry = readPlanAuditEntries(input.planId).at(-1);
  const entry = appendImmutableLedgerEntry({
    payload: {
      auditId: `plan-audit:${hashEvidence({
        planId: input.planId,
        eventType: input.eventType,
        details: input.details,
      }).slice(0, 16)}`,
      planId: input.planId,
      eventType: input.eventType,
      details: JSON.parse(JSON.stringify(input.details)),
    },
    previousHash: previousEntry?.entryHash ?? null,
    scope: "plan-lifecycle",
  });

  appendPlanAuditEntry(input.planId, entry);
  return entry;
}
