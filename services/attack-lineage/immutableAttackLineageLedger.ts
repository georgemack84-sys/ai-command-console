import type { AttackReplayLedgerEntry } from "@/types/constitutional-attack-engine";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendImmutableAttackLineageLedger(input: {
  existing?: readonly AttackReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly AttackReplayLedgerEntry[] {
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
