import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { HiddenExecutionAuditLedgerEntry } from "./types/hiddenExecutionDetectionTypes";

export function appendHiddenExecutionAuditEntry(input: {
  existing?: readonly HiddenExecutionAuditLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly HiddenExecutionAuditLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
