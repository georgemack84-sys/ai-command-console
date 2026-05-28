import type { CertificationReplayLedgerEntry } from "@/types/coordination-readiness-certification";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendCertificationAuditLedger(input: {
  existing?: readonly CertificationReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly CertificationReplayLedgerEntry[] {
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
