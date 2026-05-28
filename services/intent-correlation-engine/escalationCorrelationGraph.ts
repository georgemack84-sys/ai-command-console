import type {
  CorrelationReplayBinding,
  EscalationCorrelationGraph,
  IntentCorrelationError,
  IntentCorrelationRelationship,
} from "@/types/intent-correlation-engine";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import { buildCorrelationBoundary } from "./correlationSchemas";
import { createCorrelationError } from "./correlationErrors";
import { hashCorrelationValue } from "./correlationHasher";

export function buildEscalationCorrelationGraphs(input: {
  escalations: readonly ConstitutionalEscalationRecord[];
  relationships: readonly IntentCorrelationRelationship[];
  replayBinding: CorrelationReplayBinding;
}): Readonly<{
  graphs: readonly EscalationCorrelationGraph[];
  errors: readonly IntentCorrelationError[];
}> {
  const errors: IntentCorrelationError[] = [];
  const graphs = input.escalations
    .filter((escalation) => escalation.recommendation.executable === false)
    .sort((left, right) => left.recommendation.escalationId.localeCompare(right.recommendation.escalationId))
    .map((escalation) => Object.freeze({
      graphId: hashCorrelationValue("intent-correlation-escalation-graph-id", {
        escalationId: escalation.recommendation.escalationId,
        replayBindingId: input.replayBinding.replayBindingId,
      }),
      proposalIds: Object.freeze(
        [...new Set(input.relationships.flatMap((relationship) => [relationship.sourceProposalId, relationship.targetProposalId]))].sort(),
      ),
      escalationIds: Object.freeze([escalation.recommendation.escalationId]),
      relationshipIds: Object.freeze(
        input.relationships
          .filter((relationship) => relationship.relationshipKind === "escalation-related")
          .map((relationship) => relationship.correlationId)
          .sort(),
      ),
      governanceState:
        escalation.recommendation.severity === "E5" || escalation.recommendation.severity === "E4" ? "blocked"
        : escalation.recommendation.severity === "E3" || escalation.recommendation.severity === "E2" ? "restricted"
        : escalation.recommendation.severity === "E1" ? "review"
        : "normal",
      boundary: buildCorrelationBoundary(),
      replayBindingId: input.replayBinding.replayBindingId,
      graphHash: hashCorrelationValue("intent-correlation-escalation-graph", {
        escalationId: escalation.recommendation.escalationId,
        severity: escalation.recommendation.severity,
      }),
    }));

  for (const escalation of input.escalations) {
    if (escalation.recommendation.executable !== false) {
      errors.push(createCorrelationError(
        "PHASE_4_6B_CORRELATION_ESCALATION_AUTHORITY_REJECTED",
        "Escalation correlation must remain visibility-only.",
        `escalations.${escalation.recommendation.escalationId}`,
      ));
    }
  }

  return Object.freeze({
    graphs: Object.freeze(graphs),
    errors: Object.freeze(errors),
  });
}
