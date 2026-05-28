import { hashEvidence } from "./evidenceHashing";

export type ImmutableAuditLedgerEntry<T> = {
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: T;
};

export function appendImmutableLedgerEntry<T>(input: {
  payload: T;
  previousHash?: string | null;
  scope: string;
}) : ImmutableAuditLedgerEntry<T> {
  const previousHash = input.previousHash ?? null;
  const entryHash = hashEvidence({
    previousHash,
    payload: input.payload,
    scope: input.scope,
  });

  return {
    ledgerId: `ledger:${input.scope}:${entryHash.slice(0, 16)}`,
    previousHash,
    entryHash,
    payload: input.payload,
  };
}

export function verifyImmutableLedgerChain(entries: ImmutableAuditLedgerEntry<unknown>[]) {
  return entries.every((entry, index) => {
    if (index === 0) {
      return entry.previousHash === null;
    }
    return entry.previousHash === entries[index - 1]?.entryHash;
  });
}
