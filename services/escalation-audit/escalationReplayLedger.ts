import type { EscalationReplayLedgerEntry } from "@/types/escalation-aware-coordination";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendEscalationReplayLedger(input: {
  existing?: readonly EscalationReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly EscalationReplayLedgerEntry[] {
  const previousHash = input.existing && input.existing.length > 0
    ? input.existing[input.existing.length - 1]?.entryHash ?? null
    : null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), Object.freeze(entry)]);
}
