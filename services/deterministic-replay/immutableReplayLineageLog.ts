import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  DeterministicReplayLedgerEntry,
  DeterministicReplayLineageEntry,
  DeterministicReplayLineageLedger,
} from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function appendDeterministicReplayLineage(input: {
  existing?: DeterministicReplayLineageLedger;
  entry: DeterministicReplayLineageEntry;
}): DeterministicReplayLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashReplayValue("deterministic-replay-lineage", entries),
  });
}

export function appendDeterministicReplayLedger(input: {
  existing?: readonly DeterministicReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly DeterministicReplayLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
