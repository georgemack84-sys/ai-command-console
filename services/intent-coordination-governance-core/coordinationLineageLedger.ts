import type { CoordinationLineageEntry, CoordinationLineageLedger } from "@/types/intent-coordination-governance-core";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export function appendCoordinationGovernanceLineage(input: {
  existing?: CoordinationLineageLedger;
  coordinationId: string;
  coordinationHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}): CoordinationLineageLedger {
  const entry: CoordinationLineageEntry = Object.freeze({
    entryId: hashCoordinationGovernanceValue("intent-coordination-lineage-entry-id", {
      coordinationId: input.coordinationId,
      coordinationHash: input.coordinationHash,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    coordinationHash: input.coordinationHash,
    replayHash: input.replayHash,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  const entries = Object.freeze([...(input.existing?.entries ?? []), entry]);
  return Object.freeze({
    ledgerId: hashCoordinationGovernanceValue("intent-coordination-lineage-ledger-id", {
      previousLedgerId: input.existing?.ledgerId ?? "none",
      entries,
    }),
    entries,
    immutable: true,
  });
}
