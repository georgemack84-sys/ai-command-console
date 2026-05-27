import type {
  RecommendationLineageArtifact,
  RecommendationLineageEntry,
  RecommendationLineageError,
  RecommendationLineageInput,
  RecommendationLineageResult,
} from "./recommendationLineageStateTypes";
import { validateRecommendationLineageInput } from "./recommendationLineageSchemas";
import { buildLineageGraph } from "./lineageGraphBuilder";
import { buildLineageSnapshot } from "./lineageSnapshotEngine";
import { appendRecommendationLineage, appendRecommendationLineageLedger } from "./immutableRecommendationLineageLog";
import { aggregateRecommendationLineageMetrics } from "./recommendationLineageAggregator";
import { generateRecommendationLineageEvidence } from "./recommendationLineageEvidenceGenerator";
import { buildEvidenceLineage } from "./evidenceLineageEngine";
import { buildGovernanceLineage } from "./governanceLineageEngine";
import { buildScoringLineage } from "./scoringLineageEngine";
import { buildPolicyLineage } from "./policyLineageEngine";
import { buildReplayLineage } from "./replayLineageEngine";
import { buildApprovalLineage } from "./approvalLineageEngine";
import { detectLineageDrift } from "./lineageDriftDetector";
import { validateRecommendationLineageContainmentBoundary } from "./recommendationLineageContainmentBoundary";
import { validateRecommendationLineageAuthorityFirewall } from "./recommendationLineageAuthorityFirewall";
import { blockRecommendationLineageExecution } from "./recommendationLineageExecutionBlocker";
import { validateRecommendationLineageGovernanceBinding } from "./recommendationLineageGovernanceBindingValidator";
import { validateRecommendationLineageReplayBinding } from "./recommendationLineageReplayBindingValidator";
import { validateRecommendationLineageIsolationBoundary } from "./recommendationLineageIsolationBoundary";
import { validateOperatorLineageInspection } from "./operatorLineageInspectionValidator";
import { validateLineageFreezeControl } from "./lineageFreezeController";
import { validateLineageRevocation } from "./lineageRevocationValidator";
import { validateLineageEscalation } from "./lineageEscalationController";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

function freezeErrors(items: readonly RecommendationLineageError[]): readonly RecommendationLineageError[] {
  return Object.freeze([...items]);
}

export function buildRecommendationLineage(
  input: RecommendationLineageInput,
): RecommendationLineageResult {
  const schemaErrors = validateRecommendationLineageInput(input);
  const evidenceLineage = buildEvidenceLineage(input);
  const governanceLineage = buildGovernanceLineage(input);
  const scoringLineage = buildScoringLineage(input);
  const policyLineage = buildPolicyLineage(input);
  const replayLineage = buildReplayLineage(input);
  const approvalLineage = buildApprovalLineage(input);
  const graph = buildLineageGraph(input);
  const snapshot = buildLineageSnapshot(input, graph);

  const driftErrors = detectLineageDrift({
    lineageInput: input,
    evidenceLineage: evidenceLineage.record,
    governanceLineage: governanceLineage.record,
    scoringLineage: scoringLineage.record,
    policyLineage: policyLineage.record,
    replayLineage: replayLineage.record,
    approvalLineage: approvalLineage.record,
  });
  const containmentErrors = validateRecommendationLineageContainmentBoundary(input);
  const authorityErrors = validateRecommendationLineageAuthorityFirewall(input);
  const executionErrors = blockRecommendationLineageExecution(input);
  const governanceBindingErrors = validateRecommendationLineageGovernanceBinding(input);
  const replayBindingErrors = validateRecommendationLineageReplayBinding(input);
  const isolationErrors = validateRecommendationLineageIsolationBoundary(input);
  const operatorInspectionErrors = validateOperatorLineageInspection(input);
  const freezeErrorsList = validateLineageFreezeControl(input);
  const revocationErrors = validateLineageRevocation(input);
  const escalationErrors = validateLineageEscalation(input);

  const errors = freezeErrors([
    ...schemaErrors,
    ...evidenceLineage.errors,
    ...governanceLineage.errors,
    ...scoringLineage.errors,
    ...policyLineage.errors,
    ...replayLineage.errors,
    ...approvalLineage.errors,
    ...driftErrors,
    ...containmentErrors,
    ...authorityErrors,
    ...executionErrors,
    ...governanceBindingErrors,
    ...replayBindingErrors,
    ...isolationErrors,
    ...operatorInspectionErrors,
    ...freezeErrorsList,
    ...revocationErrors,
    ...escalationErrors,
  ]);

  const metrics = aggregateRecommendationLineageMetrics({
    errors,
    reconstructionTime: graph.nodes.length + graph.edges.length,
  });
  const evidence = generateRecommendationLineageEvidence({
    lineageInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });

  const artifactBase = {
    recommendationId: input.recommendationId,
    lineageId: input.lineageId,
    evidenceSnapshotIds: [...snapshot.evidenceSnapshotIds],
    governanceSnapshotId: snapshot.governanceSnapshotId,
    scoringSnapshotId: snapshot.scoringSnapshotId,
    policySnapshotId: snapshot.policySnapshotId,
    approvalSnapshotId: snapshot.approvalSnapshotId,
    replaySnapshotId: snapshot.replaySnapshotId,
    escalationSnapshotId: snapshot.escalationSnapshotId,
    interventionSnapshotId: snapshot.interventionSnapshotId,
    lineageHash: graph.graphHash,
    replayHash: replayLineage.record.deterministicHash,
    governanceHash: governanceLineage.record.deterministicHash,
    approvalHash: approvalLineage.record.deterministicHash,
    createdAt: input.createdAt,
    advisoryOnly: true as const,
    executable: false as const,
    executionAuthorized: false as const,
    orchestrationAllowed: false as const,
    runtimeMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    schedulerRegistrationAllowed: false as const,
    operatorReviewRequired: true as const,
  };
  const artifact: RecommendationLineageArtifact = Object.freeze(artifactBase);
  const failClosed = errors.length > 0;

  const lineageEntry: RecommendationLineageEntry = Object.freeze({
    entryId: hashRecommendationLineageValue("recommendation-lineage-entry-id", {
      recommendationId: input.recommendationId,
      createdAt: input.createdAt,
    }),
    recommendationId: input.recommendationId,
    lineageId: input.lineageId,
    createdAt: input.createdAt,
    lineageHash: graph.graphHash,
    failClosed,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-entry", {
      recommendationId: input.recommendationId,
      lineageId: input.lineageId,
      failClosed,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendRecommendationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendRecommendationLineageLedger({
    existing: appendRecommendationLineageLedger({
      existing: input.existingReplayLedger,
      payload: Object.freeze({
        event: "recommendation.lineage.evaluated",
        recommendationId: input.recommendationId,
        lineageId: input.lineageId,
        evidenceHash: evidence.evidenceHash,
        graphHash: graph.graphHash,
        failClosed,
      }),
      scope: "recommendation-lineage",
    }),
    payload: Object.freeze({
      event: failClosed ? "recommendation.lineage.failed_closed" : "recommendation.lineage.certified",
      recommendationId: input.recommendationId,
      lineageHash: lineage.lineageHash,
      metricsHash: metrics.metricsHash,
    }),
    scope: "recommendation-lineage-audit",
  });

  return Object.freeze({
    artifact,
    graph,
    snapshot,
    metrics,
    evidenceLineage: evidenceLineage.record,
    governanceLineage: governanceLineage.record,
    scoringLineage: Object.freeze({
      ...scoringLineage.record,
      confidenceEvolution: scoringLineage.confidenceHistory,
    }),
    policyLineage: policyLineage.record,
    replayLineage: replayLineage.record,
    approvalLineage: approvalLineage.record,
    evidence,
    lineage,
    replayLedger,
    warnings: Object.freeze(failClosed
      ? ["Recommendation lineage failed closed and preserved immutable ancestry under uncertainty."]
      : ["Recommendation lineage remained advisory-only, replay-safe, and append-only."]),
    errors,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-result", {
      recommendationId: input.recommendationId,
      artifact,
      graphHash: graph.graphHash,
      snapshotHash: snapshot.snapshotHash,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      metricsHash: metrics.metricsHash,
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildRecommendationLineageEngine = buildRecommendationLineage;
export { appendRecommendationLineage } from "./immutableRecommendationLineageLog";
