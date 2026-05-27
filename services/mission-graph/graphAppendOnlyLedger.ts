import type { MissionGraphLedger, MissionGraphLedgerEntry } from "@/types/mission-graph";
import { hashMissionGraphValue } from "./graphHasher";

export function appendMissionGraphLedger(input: {
  existing?: MissionGraphLedger;
  entry: MissionGraphLedgerEntry;
}): MissionGraphLedger {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ]);
  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? `mission-graph-ledger-${input.entry.snapshotId}`,
    entries,
    ledgerHash: hashMissionGraphValue("mission-graph-ledger", entries),
  });
}
