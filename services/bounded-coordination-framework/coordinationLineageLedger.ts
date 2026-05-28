import type { CoordinationLineageEntry, CoordinationLineageLedger } from "@/types/bounded-coordination-framework";
import { hashCoordinationValue } from "./coordinationGraphHasher";

export function appendCoordinationLineage(input: {
  existing?: CoordinationLineageLedger;
  graphId: string;
  graphHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}): CoordinationLineageLedger {
  const existingEntries = input.existing?.entries ?? [];
  const entry: CoordinationLineageEntry = Object.freeze({
    entryId: hashCoordinationValue("coordination-lineage-entry-id", {
      graphId: input.graphId,
      createdAt: input.createdAt,
    }),
    graphId: input.graphId,
    graphHash: input.graphHash,
    replayHash: input.replayHash,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    ledgerId: hashCoordinationValue("coordination-lineage-ledger-id", {
      previousLedgerId: input.existing?.ledgerId,
      graphId: input.graphId,
      entryCount: existingEntries.length + 1,
    }),
    entries: Object.freeze([...existingEntries, entry]),
    immutable: true,
  });
}
