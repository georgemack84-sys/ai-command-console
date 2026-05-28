import type {
  ApprovalConflictLineage,
  ApprovalConflictLineageGraph,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "@/services/approval-conflict/deterministicApprovalConflictHasher";

export function buildApprovalConflictLineageGraph(
  lineage: ApprovalConflictLineage,
): ApprovalConflictLineageGraph {
  const nodeIds = Object.freeze(lineage.entries.map((entry) => entry.entryId));
  const edgeIds = Object.freeze(lineage.entries.slice(1).map((entry, index) =>
    `${lineage.entries[index]?.entryId ?? "missing"}->${entry.entryId}`
  ));
  const recursive = new Set(nodeIds).size !== nodeIds.length;
  return Object.freeze({
    graphId: hashApprovalConflictValue("graph-id", nodeIds),
    nodeIds,
    edgeIds,
    recursive,
    graphHash: hashApprovalConflictValue("graph", {
      nodeIds,
      edgeIds,
      recursive,
    }),
  });
}
