import type { CoordinationReplayTimelineEntry, ImmutableReplayLineageLedger } from "@/types/coordination-replay";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function appendImmutableReplayLedger(input: {
  existing?: ImmutableReplayLineageLedger;
  entries: readonly CoordinationReplayTimelineEntry[];
}): ImmutableReplayLineageLedger {
  const merged = Object.freeze([
    ...(input.existing?.entries ?? []),
    ...input.entries,
  ].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.entryId.localeCompare(right.entryId);
  }));

  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? hashCoordinationReplayValue("ledger-id", merged[0]?.entryId ?? "empty"),
    entries: merged,
    ledgerHash: hashCoordinationReplayValue("ledger-hash", merged),
  });
}
