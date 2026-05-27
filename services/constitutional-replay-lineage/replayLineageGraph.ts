import type {
  ConstitutionalReplayLineage,
  ConstitutionalReplayLineageGraph,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function buildReplayAttackLineageGraph(
  lineage: ConstitutionalReplayLineage,
): ConstitutionalReplayLineageGraph {
  const nodeIds = Object.freeze(lineage.entries.map((entry) => entry.entryId));
  const edgeIds = Object.freeze(lineage.entries.slice(1).map((entry, index) =>
    `${lineage.entries[index]?.entryId ?? "missing"}->${entry.entryId}`
  ));
  const recursive = new Set(nodeIds).size !== nodeIds.length;
  return Object.freeze({
    graphId: hashConstitutionalReplayValue("lineage-graph-id", nodeIds),
    nodeIds,
    edgeIds,
    recursive,
    graphHash: hashConstitutionalReplayValue("lineage-graph", { nodeIds, edgeIds, recursive }),
  });
}
