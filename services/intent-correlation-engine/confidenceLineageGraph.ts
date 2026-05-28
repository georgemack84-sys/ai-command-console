import type {
  CorrelationConfidenceLineageGraph,
  CorrelationReplayBinding,
  IntentCorrelationError,
} from "@/types/intent-correlation-engine";
import type { ConstitutionalAutonomyReadinessGateRecord } from "@/services/constitutional-autonomy-readiness-gate";
import { buildCorrelationBoundary } from "./correlationSchemas";
import { createCorrelationError } from "./correlationErrors";
import { hashCorrelationValue } from "./correlationHasher";

export function buildConfidenceLineageGraphs(input: {
  readinessGates: readonly ConstitutionalAutonomyReadinessGateRecord[];
  relationshipIds: readonly string[];
  replayBinding: CorrelationReplayBinding;
}): Readonly<{
  graphs: readonly CorrelationConfidenceLineageGraph[];
  errors: readonly IntentCorrelationError[];
}> {
  const errors: IntentCorrelationError[] = [];
  const points = input.readinessGates.map((gate) => Object.freeze({
    proposalId: gate.proposalView.proposalId,
    confidenceProfileId: gate.replayBinding.confidenceLineageHash,
    observedConfidence: gate.proposalView.confidenceScore,
    observedAt: gate.proposalView.createdAt,
    sourceReplayId: gate.replayBinding.reconstructionHash,
  })).sort((left, right) => left.proposalId.localeCompare(right.proposalId));

  for (const point of points) {
    if (typeof point.observedConfidence !== "number" || Number.isNaN(point.observedConfidence)) {
      errors.push(createCorrelationError(
        "PHASE_4_6B_CORRELATION_CONFIDENCE_MUTATION_REJECTED",
        "Confidence lineage points must be historical numeric observations.",
        `points.${point.proposalId}`,
      ));
    }
  }

  const graph: CorrelationConfidenceLineageGraph = Object.freeze({
    graphId: hashCorrelationValue("intent-correlation-confidence-graph-id", {
      replayBindingId: input.replayBinding.replayBindingId,
      proposalIds: points.map((point) => point.proposalId),
    }),
    points: Object.freeze(points),
    relationshipIds: Object.freeze([...input.relationshipIds].sort()),
    boundary: buildCorrelationBoundary(),
    replayBindingId: input.replayBinding.replayBindingId,
    graphHash: hashCorrelationValue("intent-correlation-confidence-graph", points),
  });

  return Object.freeze({
    graphs: Object.freeze([graph]),
    errors: Object.freeze(errors),
  });
}
