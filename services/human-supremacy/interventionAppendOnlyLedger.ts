import type { InterventionLedgerEntry, InterventionLineage } from "@/types/human-supremacy";
import { hashInterventionValue } from "./interventionHasher";

export function appendInterventionLedger(input: {
  existing?: InterventionLineage;
  entry: InterventionLedgerEntry;
}): InterventionLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ]);
  return Object.freeze({
    lineageId: input.existing?.lineageId ?? `intervention-lineage-${input.entry.coordinationId}`,
    entries,
    lineageHash: hashInterventionValue("intervention-lineage", entries),
  });
}
