import type { IntentCorrelationError, IntentCorrelationRelationship } from "@/types/intent-correlation-engine";
import { createCorrelationError } from "./correlationErrors";

export function inspectCorrelationTopology(relationships: readonly IntentCorrelationRelationship[]): readonly IntentCorrelationError[] {
  const errors: IntentCorrelationError[] = [];
  const edgeKeys = new Set<string>();

  for (const relationship of relationships) {
    if (relationship.sourceProposalId === relationship.targetProposalId) {
      errors.push(createCorrelationError("PHASE_4_6B_CORRELATION_RECURSIVE_GRAPH", "Self-correlation is forbidden.", `relationships.${relationship.correlationId}`));
    }
    const edgeKey = `${relationship.sourceProposalId}=>${relationship.targetProposalId}`;
    if (edgeKeys.has(edgeKey)) {
      errors.push(createCorrelationError(
        "PHASE_4_6B_CORRELATION_AMBIGUOUS_TOPOLOGY",
        "Duplicate explicit correlation edges are forbidden.",
        `relationships.${relationship.correlationId}`,
      ));
    }
    edgeKeys.add(edgeKey);
  }

  return Object.freeze(errors);
}
