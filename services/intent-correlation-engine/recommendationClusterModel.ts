import type {
  CorrelationReplayBinding,
  IntentCorrelationError,
  IntentCorrelationRelationship,
  RecommendationCluster,
} from "@/types/intent-correlation-engine";
import { buildCorrelationBoundary } from "./correlationSchemas";
import { createCorrelationError } from "./correlationErrors";
import { hashCorrelationValue } from "./correlationHasher";

export function buildRecommendationClusters(input: {
  relationships: readonly IntentCorrelationRelationship[];
  replayBinding: CorrelationReplayBinding;
  createdAt: string;
}): Readonly<{
  clusters: readonly RecommendationCluster[];
  errors: readonly IntentCorrelationError[];
}> {
  const errors: IntentCorrelationError[] = [];
  const grouped = new Map<string, IntentCorrelationRelationship[]>();

  for (const relationship of input.relationships) {
    const key = relationship.relationshipKind;
    const existing = grouped.get(key) ?? [];
    existing.push(relationship);
    grouped.set(key, existing);
  }

  const clusters = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, relationships]) => {
      const proposalIds = [...new Set(relationships.flatMap((relationship) => [relationship.sourceProposalId, relationship.targetProposalId]))].sort();
      if (proposalIds.length > relationships.length + 1) {
        errors.push(createCorrelationError(
          "PHASE_4_6B_CORRELATION_RECURSIVE_GRAPH",
          "Cluster growth exceeded the explicit relationship boundary.",
          `clusters.${kind}`,
        ));
      }
      return Object.freeze({
        clusterId: hashCorrelationValue("intent-correlation-cluster-id", {
          kind,
          proposalIds,
          replayBindingId: input.replayBinding.replayBindingId,
        }),
        proposalIds: Object.freeze(proposalIds),
        relationshipIds: Object.freeze(relationships.map((relationship) => relationship.correlationId).sort()),
        clusterReasonCodes: Object.freeze([kind, "bounded-visibility-cluster"]),
        governanceState: relationships.some((relationship) => relationship.governanceState === "blocked") ? "blocked" : "normal",
        boundary: buildCorrelationBoundary(),
        replayBindingId: input.replayBinding.replayBindingId,
        clusterHash: hashCorrelationValue("intent-correlation-cluster", {
          kind,
          relationshipIds: relationships.map((relationship) => relationship.correlationId).sort(),
        }),
        createdAt: input.createdAt,
      });
    });

  return Object.freeze({
    clusters: Object.freeze(clusters),
    errors: Object.freeze(errors),
  });
}
