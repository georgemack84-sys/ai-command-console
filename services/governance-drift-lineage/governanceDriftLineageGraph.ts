import type {
  GovernanceDriftLineage,
  GovernanceDriftLineageGraph,
} from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function buildGovernanceDriftLineageGraph(
  lineage: GovernanceDriftLineage,
): GovernanceDriftLineageGraph {
  const nodeIds = Object.freeze(lineage.entries.map((entry) => entry.entryId));
  const edgeIds = Object.freeze(lineage.entries.slice(1).map((entry, index) =>
    `${lineage.entries[index]?.entryId ?? "missing"}->${entry.entryId}`
  ));
  const recursive = new Set(nodeIds).size !== nodeIds.length;
  return Object.freeze({
    graphId: hashGovernanceDriftValue("lineage-graph-id", nodeIds),
    nodeIds,
    edgeIds,
    recursive,
    graphHash: hashGovernanceDriftValue("lineage-graph", { nodeIds, edgeIds, recursive }),
  });
}
