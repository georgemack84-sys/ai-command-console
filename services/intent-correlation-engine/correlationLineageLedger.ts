import type { CorrelationLineageEntry, CorrelationLineageLedger } from "@/types/intent-correlation-engine";
import { hashCorrelationValue } from "./correlationHasher";

export function appendCorrelationLineage(input: {
  existing?: CorrelationLineageLedger;
  resultHash: string;
  replayBindingId: string;
  createdAt: string;
}): CorrelationLineageLedger {
  const entry: CorrelationLineageEntry = Object.freeze({
    entryId: hashCorrelationValue("intent-correlation-lineage-entry-id", {
      resultHash: input.resultHash,
      replayBindingId: input.replayBindingId,
      createdAt: input.createdAt,
    }),
    resultHash: input.resultHash,
    replayBindingId: input.replayBindingId,
    createdAt: input.createdAt,
  });

  const entries = Object.freeze([...(input.existing?.entries ?? []), entry]);
  return Object.freeze({
    ledgerId: hashCorrelationValue("intent-correlation-lineage-ledger-id", {
      previousLedgerId: input.existing?.ledgerId ?? "none",
      entries,
    }),
    entries,
    immutable: true,
  });
}
