import type {
  SupremacyLineageEntry,
  SupremacyLineageLedger,
} from "./supremacyStateTypes";
import { hashOverrideLineage } from "./overrideLineageHasher";

export function appendInterventionLineage(input: {
  existing?: SupremacyLineageLedger;
  entry: SupremacyLineageEntry;
}): SupremacyLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashOverrideLineage("lineage", entries),
  });
}
