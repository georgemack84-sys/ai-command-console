import type {
  CorrelationResult,
  IntentCorrelationError,
} from "@/types/intent-correlation-engine";
import { buildCorrelationBoundary, validateCorrelationAuditEvent, validateCorrelationCluster, validateCorrelationRelationship, validateCorrelationReplayBinding } from "./correlationSchemas";
import { guardCorrelationInput } from "./correlationBoundaryGuards";
import { bindCorrelationReplay } from "./correlationReplayBinder";
import { mapProposalRelationships } from "./proposalRelationshipMapper";
import { buildRecommendationClusters } from "./recommendationClusterModel";
import { buildConfidenceLineageGraphs } from "./confidenceLineageGraph";
import { buildEscalationCorrelationGraphs } from "./escalationCorrelationGraph";
import { trackApprovalRelationships } from "./approvalRelationshipTracker";
import { validateCorrelationContainment } from "./correlationContainmentValidator";
import { inspectCorrelationTopology } from "./correlationTopologyInspector";
import { validateCorrelationDeterminism } from "./correlationDeterminismValidator";
import { appendCorrelationLineage } from "./correlationLineageLedger";
import { buildCorrelationAuditEvents } from "./correlationAuditEvents";
import { hashCorrelationValue } from "./correlationHasher";
import type { CorrelateIntentProposalsInput, CorrelationComputation } from "./correlationTypes";

export function correlateIntentProposals(input: CorrelateIntentProposalsInput): CorrelationComputation {
  const guardErrors = guardCorrelationInput(input.metadata);
  const replayResult = bindCorrelationReplay({
    coordinationRecords: input.coordinationRecords,
    proposals: input.proposals,
    readinessGates: input.readinessGates,
    escalations: input.escalations,
    approvalGraphs: input.approvalGraphs,
    createdAt: input.createdAt,
  });
  const relationshipResult = mapProposalRelationships({
    coordinationRecords: input.coordinationRecords,
    replayBinding: replayResult.replayBinding,
    createdAt: input.createdAt,
  });
  const clusterResult = buildRecommendationClusters({
    relationships: relationshipResult.relationships,
    replayBinding: replayResult.replayBinding,
    createdAt: input.createdAt,
  });
  const confidenceResult = buildConfidenceLineageGraphs({
    readinessGates: input.readinessGates,
    relationshipIds: relationshipResult.relationships.map((relationship) => relationship.correlationId),
    replayBinding: replayResult.replayBinding,
  });
  const escalationResult = buildEscalationCorrelationGraphs({
    escalations: input.escalations,
    relationships: relationshipResult.relationships,
    replayBinding: replayResult.replayBinding,
  });
  const approvalResult = trackApprovalRelationships({
    approvalGraphs: input.approvalGraphs,
    relationships: relationshipResult.relationships,
    replayBinding: replayResult.replayBinding,
  });

  const provisionalResult: CorrelationResult = Object.freeze({
    status: "correlated",
    relationships: relationshipResult.relationships,
    clusters: clusterResult.clusters,
    confidenceLineageGraphs: confidenceResult.graphs,
    escalationCorrelationGraphs: escalationResult.graphs,
    approvalObservations: approvalResult.observations,
    replayBindings: Object.freeze([replayResult.replayBinding]),
    auditEvents: Object.freeze([]),
    boundary: buildCorrelationBoundary(),
    resultHash: "",
  });

  const topologyErrors = inspectCorrelationTopology(provisionalResult.relationships);
  const containmentErrors = validateCorrelationContainment({
    relationships: provisionalResult.relationships,
    result: provisionalResult,
    metadata: input.metadata,
  });

  const status = [
    ...guardErrors,
    ...replayResult.errors,
    ...relationshipResult.errors,
    ...clusterResult.errors,
    ...confidenceResult.errors,
    ...escalationResult.errors,
    ...approvalResult.errors,
    ...topologyErrors,
    ...containmentErrors,
  ].length === 0 ? "correlated" as const : "rejected" as const;

  const resultHash = hashCorrelationValue("intent-correlation-result", {
    relationships: provisionalResult.relationships,
    clusters: provisionalResult.clusters,
    confidenceLineageGraphs: provisionalResult.confidenceLineageGraphs,
    escalationCorrelationGraphs: provisionalResult.escalationCorrelationGraphs,
    approvalObservations: provisionalResult.approvalObservations,
    replayBindings: provisionalResult.replayBindings,
    status,
  });

  const result: CorrelationResult = Object.freeze({
    ...provisionalResult,
    status,
    resultHash,
  });
  const lineage = appendCorrelationLineage({
    existing: input.existingLineage,
    resultHash: result.resultHash,
    replayBindingId: replayResult.replayBinding.replayBindingId,
    createdAt: input.createdAt,
  });
  const auditEvents = buildCorrelationAuditEvents({
    result,
    createdAt: input.createdAt,
  });
  const determinismErrors = validateCorrelationDeterminism(result);

  const validationErrors: IntentCorrelationError[] = [
    ...result.relationships.flatMap((relationship) => validateCorrelationRelationship(relationship)),
    ...result.clusters.flatMap((cluster) => validateCorrelationCluster(cluster)),
    ...result.replayBindings.flatMap((binding) => validateCorrelationReplayBinding(binding)),
    ...auditEvents.flatMap((event) => validateCorrelationAuditEvent(event)),
  ];

  const errors: IntentCorrelationError[] = [
    ...guardErrors,
    ...replayResult.errors,
    ...relationshipResult.errors,
    ...clusterResult.errors,
    ...confidenceResult.errors,
    ...escalationResult.errors,
    ...approvalResult.errors,
    ...topologyErrors,
    ...containmentErrors,
    ...determinismErrors,
    ...validationErrors,
  ];

  return Object.freeze({
    result: Object.freeze({
      ...result,
      auditEvents,
    }),
    lineage,
    warnings: Object.freeze(
      input.coordinationRecords.flatMap((record) => record.warnings).concat("Correlation remains informational only and does not imply execution or sequencing."),
    ),
    errors: Object.freeze(errors),
  });
}
