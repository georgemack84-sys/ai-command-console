import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceAncestryGraph, EvidenceReference } from "./types/evidenceAggregationTypes";

export function buildEvidenceAncestryGraph(
  references: readonly EvidenceReference[],
): EvidenceAncestryGraph {
  const nodes = Object.freeze(
    references.map((reference) => Object.freeze({
      evidenceId: reference.evidenceId,
      parentEvidenceIds: Object.freeze([...reference.lineage.parentEvidenceIds]),
      sourceSnapshots: Object.freeze([...reference.lineage.sourceSnapshots]),
      nodeHash: hashEvidenceValue("evidence-ancestry-node", reference.lineage),
    })),
  );
  return Object.freeze({
    nodes,
    graphHash: hashEvidenceValue("evidence-ancestry-graph", nodes),
  });
}
