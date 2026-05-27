import type { ConstitutionalAuditLedgerEntry } from "@/types/constitutional-audit-episode";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendImmutableConstitutionalEpisodeLedger(input: {
  existing?: readonly ConstitutionalAuditLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ConstitutionalAuditLedgerEntry[] {
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
