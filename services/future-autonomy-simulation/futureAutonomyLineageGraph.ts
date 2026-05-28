import type {
  FutureAutonomyLineage,
  FutureAutonomyLineageGraph,
} from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function buildFutureAutonomyLineageGraph(
  lineage: FutureAutonomyLineage,
): FutureAutonomyLineageGraph {
  const nodeIds = Object.freeze(lineage.entries.map((entry) => entry.entryId));
  const edgeIds = Object.freeze(lineage.entries.slice(1).map((entry, index) =>
    `${lineage.entries[index]?.entryId ?? "root"}->${entry.entryId}`,
  ));
  const recursive = new Set(nodeIds).size !== nodeIds.length;
  return Object.freeze({
    graphId: hashFutureAutonomyValue("future-autonomy-lineage-graph-id", lineage.lineageId),
    nodeIds,
    edgeIds,
    recursive,
    graphHash: hashFutureAutonomyValue("future-autonomy-lineage-graph", {
      nodeIds,
      edgeIds,
      recursive,
    }),
  });
}
