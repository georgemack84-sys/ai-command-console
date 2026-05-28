import type {
  ApprovalRelationshipObservation,
  CorrelationReplayBinding,
  IntentCorrelationError,
  IntentCorrelationRelationship,
} from "@/types/intent-correlation-engine";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import { buildCorrelationBoundary } from "./correlationSchemas";
import { createCorrelationError } from "./correlationErrors";
import { hashCorrelationValue } from "./correlationHasher";

export function trackApprovalRelationships(input: {
  approvalGraphs: readonly ApprovalDependencyGraph[];
  relationships: readonly IntentCorrelationRelationship[];
  replayBinding: CorrelationReplayBinding;
}): Readonly<{
  observations: readonly ApprovalRelationshipObservation[];
  errors: readonly IntentCorrelationError[];
}> {
  const errors: IntentCorrelationError[] = [];
  const observations = input.relationships
    .filter((relationship) => relationship.relationshipKind === "approval-related")
    .map((relationship) => {
      const matchingApprovals = input.approvalGraphs
        .filter((graph) => graph.proposalId === relationship.sourceProposalId || graph.proposalId === relationship.targetProposalId)
        .flatMap((graph) => graph.nodes.map((node) => node.approvalId))
        .sort();
      return Object.freeze({
        observationId: hashCorrelationValue("intent-correlation-approval-observation-id", {
          correlationId: relationship.correlationId,
          replayBindingId: input.replayBinding.replayBindingId,
        }),
        sourceProposalId: relationship.sourceProposalId,
        targetProposalId: relationship.targetProposalId,
        approvalIds: Object.freeze(matchingApprovals),
        relationshipKind: "approval-related" as const,
        approvalInheritance: false as const,
        boundary: buildCorrelationBoundary(),
        replayBindingId: input.replayBinding.replayBindingId,
        observationHash: hashCorrelationValue("intent-correlation-approval-observation", {
          correlationId: relationship.correlationId,
          approvalIds: matchingApprovals,
        }),
      });
    });

  if (observations.some((observation) => observation.approvalInheritance !== false)) {
    errors.push(createCorrelationError(
      "PHASE_4_6B_CORRELATION_APPROVAL_INHERITANCE_REJECTED",
      "Approval relationship observations cannot inherit approval authority.",
      "approvalObservations",
    ));
  }

  return Object.freeze({
    observations: Object.freeze(observations),
    errors: Object.freeze(errors),
  });
}
