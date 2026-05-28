import type { ReplayStabilityLedgerEntry } from "./replayStateTypes";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendReplayAuditLedger(input: {
  existing?: readonly ReplayStabilityLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ReplayStabilityLedgerEntry[] {
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
