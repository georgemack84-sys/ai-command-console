import type {
  ConstitutionalAuditLineageGraph,
  ConstitutionalAuditLineageLedger,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function buildConstitutionalLineageGraph(
  lineage: ConstitutionalAuditLineageLedger,
): ConstitutionalAuditLineageGraph {
  const nodeIds = Object.freeze(lineage.entries.map((entry) => entry.entryId));
  const edgeIds = Object.freeze(lineage.entries.slice(1).map((entry, index) =>
    `${lineage.entries[index]?.entryId ?? "root"}->${entry.entryId}`,
  ));
  const recursive = new Set(nodeIds).size !== nodeIds.length;
  return Object.freeze({
    graphId: hashConstitutionalAuditValue("constitutional-audit-lineage-graph-id", lineage.ledgerId),
    nodeIds,
    edgeIds,
    recursive,
    graphHash: hashConstitutionalAuditValue("constitutional-audit-lineage-graph", {
      nodeIds,
      edgeIds,
      recursive,
    }),
  });
}
