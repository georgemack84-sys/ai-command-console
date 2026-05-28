import type {
  ReadinessLineageEntry,
  ReadinessLineageGraph,
  ReadinessLineageLedger,
} from "@/types/constitutional-readiness";
import { hashReadinessValue } from "./readinessHashEngine";

export function appendReadinessLineage(input: {
  existing?: ReadinessLineageLedger;
  entry: ReadinessLineageEntry;
}): ReadinessLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashReadinessValue("constitutional-readiness-lineage", entries),
  });
}

export function buildReadinessLineageGraph(lineage: ReadinessLineageLedger): ReadinessLineageGraph {
  const nodes = Object.freeze(lineage.entries.map((entry) => Object.freeze({
    nodeId: entry.entryId,
    readinessId: entry.readinessId,
    classification: entry.readinessClassification,
  })));
  const edges = Object.freeze(lineage.entries.slice(1).map((entry, index) => Object.freeze({
    from: lineage.entries[index]!.entryId,
    to: entry.entryId,
    deterministicHash: hashReadinessValue("constitutional-readiness-lineage-edge", {
      from: lineage.entries[index]!.entryId,
      to: entry.entryId,
    }),
  })));
  return Object.freeze({
    graphId: hashReadinessValue("constitutional-readiness-lineage-graph-id", lineage.lineageHash),
    nodes,
    edges,
    graphHash: hashReadinessValue("constitutional-readiness-lineage-graph", {
      nodes,
      edges,
    }),
  });
}
