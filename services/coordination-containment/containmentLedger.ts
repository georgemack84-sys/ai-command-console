import type { ContainmentLedger, ContainmentLedgerEntry } from "@/types/coordination-containment";
import { hashContainmentValue } from "./containmentHasher";

export function appendContainmentLedger(input: {
  existing?: ContainmentLedger;
  entry: ContainmentLedgerEntry;
}): ContainmentLedger {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    const createdAt = left.createdAt.localeCompare(right.createdAt);
    return createdAt !== 0 ? createdAt : left.entryId.localeCompare(right.entryId);
  }));

  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? hashContainmentValue("containment-ledger-id", {
      firstEntryId: entries[0]?.entryId ?? "empty",
    }),
    entries,
    ledgerHash: hashContainmentValue("containment-ledger", entries),
  });
}
