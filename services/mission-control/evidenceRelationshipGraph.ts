import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEvidenceRelationshipGraph,
  TruthCertificationState,
  TruthEvidenceConflictSeverity,
  TruthEvidenceGraphConfidence,
  TruthEvidenceGraphRelationshipType,
  TruthEvidenceRelationshipGraphContract,
  TruthEvidenceRelationshipGraphInput,
  TruthEvidenceRelationshipGraphLedgerEntry,
  TruthEvidenceRelationshipGraphObservability,
  TruthEvidenceRelationshipGraphQueries,
  TruthEvidenceRelationshipGraphReasonCode,
  TruthEvidenceRelationshipGraphReplay,
  TruthEvidenceRelationshipGraphRequest,
  TruthEvidenceRelationshipGraphValidation,
  TruthEvidenceRelationshipGraphVisibility,
  TruthReplayResult,
} from "./types";

const RELATIONSHIP_TYPES = new Set<TruthEvidenceGraphRelationshipType>([
  "DEPENDS_ON",
  "DERIVED_FROM",
  "GENERATED_FROM",
  "REFERENCES",
  "REQUIRES",
  "SUPPORTS",
  "VALIDATES",
  "CORROBORATES",
  "CONFIRMS",
  "STRENGTHENS",
  "CONFLICTS_WITH",
  "REFUTES",
  "CONTRADICTS",
  "WEAKENS",
  "SUPERSEDES",
]);

function addReason(reasons: TruthEvidenceRelationshipGraphReasonCode[], reason: TruthEvidenceRelationshipGraphReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEvidenceRelationshipGraphRequest): TruthEvidenceRelationshipGraphRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "approvalAllowed",
    "rankingAllowed",
    "prioritizationAllowed",
    "scoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function inferRelationshipType(input: TruthEvidenceRelationshipGraphInput): TruthEvidenceGraphRelationshipType {
  if (input.relationshipType) return input.relationshipType;
  const source = input.sourceVerification.registration.evidence.evidence;
  const target = input.targetVerification.registration.evidence.evidence;
  if (source.provenance.origin_reference === target.provenance.origin_reference) return "CORROBORATES";
  if (source.evidence_payload.payload_hash === target.evidence_payload.payload_hash) return "CONFIRMS";
  if (source.provenance.origin_reference === target.evidence_id) return "DERIVED_FROM";
  if (input.sourceVerification.verification.verification_score > input.targetVerification.verification.verification_score) return "SUPERSEDES";
  return "REFERENCES";
}

function inferConfidence(sharedSignals: number): TruthEvidenceGraphConfidence {
  if (sharedSignals >= 4) return "CERTAIN";
  if (sharedSignals === 3) return "HIGH";
  if (sharedSignals === 2) return "MEDIUM";
  return "LOW";
}

function defaultConflictSeverity(type: TruthEvidenceGraphRelationshipType): TruthEvidenceConflictSeverity | undefined {
  if (type === "CONFLICTS_WITH" || type === "REFUTES") return "HIGH";
  if (type === "CONTRADICTS") return "CRITICAL";
  if (type === "WEAKENS" || type === "SUPERSEDES") return "MEDIUM";
  return undefined;
}

function isDependencyType(type: TruthEvidenceGraphRelationshipType): boolean {
  return ["DEPENDS_ON", "DERIVED_FROM", "GENERATED_FROM", "REFERENCES", "REQUIRES"].includes(type);
}

function isSupportType(type: TruthEvidenceGraphRelationshipType): boolean {
  return ["SUPPORTS", "VALIDATES", "CORROBORATES", "CONFIRMS", "STRENGTHENS"].includes(type);
}

function isConflictType(type: TruthEvidenceGraphRelationshipType): boolean {
  return ["CONFLICTS_WITH", "REFUTES", "CONTRADICTS", "WEAKENS", "SUPERSEDES"].includes(type);
}

export function buildTruthEvidenceRelationshipGraphRequest(
  request: TruthEvidenceRelationshipGraphRequest,
): TruthEvidenceRelationshipGraphRequest {
  return requestCore(request);
}

export function sealTruthEvidenceRelationshipGraph(
  input: TruthEvidenceRelationshipGraphInput,
): SealedTruthEvidenceRelationshipGraph {
  const reasons: TruthEvidenceRelationshipGraphReasonCode[] = [];
  const source = input.sourceVerification.registration.evidence.evidence;
  const target = input.targetVerification.registration.evidence.evidence;

  const sourcePresent = source.evidence_id.length > 0;
  const targetPresent = target.evidence_id.length > 0;
  addReason(reasons, sourcePresent ? "SOURCE_EVIDENCE_PRESENT" : "SOURCE_EVIDENCE_MISSING");
  addReason(reasons, targetPresent ? "TARGET_EVIDENCE_PRESENT" : "TARGET_EVIDENCE_MISSING");

  const knownEvidenceIds = input.knownEvidenceIds ?? [source.evidence_id, target.evidence_id];
  const sourceKnown = knownEvidenceIds.includes(source.evidence_id);
  const targetKnown = knownEvidenceIds.includes(target.evidence_id);
  addReason(reasons, sourceKnown ? "SOURCE_EVIDENCE_KNOWN" : "SOURCE_EVIDENCE_UNKNOWN");
  addReason(reasons, targetKnown ? "TARGET_EVIDENCE_KNOWN" : "TARGET_EVIDENCE_UNKNOWN");

  const relationshipType = inferRelationshipType(input);
  addReason(reasons, relationshipType.length > 0 ? "RELATIONSHIP_TYPE_PRESENT" : "RELATIONSHIP_TYPE_MISSING");
  const relationshipTypeValid = RELATIONSHIP_TYPES.has(relationshipType) && input.unsupportedRelationshipOutputDetected !== true;
  addReason(reasons, relationshipTypeValid ? "RELATIONSHIP_TYPE_VALID" : "RELATIONSHIP_TYPE_INVALID");

  const sharedSignals = [
    source.mission_id === target.mission_id,
    source.provenance.origin_reference === target.provenance.origin_reference,
    source.evidence_payload.payload_hash === target.evidence_payload.payload_hash,
    source.evidence_source === target.evidence_source,
  ].filter(Boolean).length;
  const confidence = inferConfidence(sharedSignals);

  const supportRationalePresent = !isSupportType(relationshipType) || input.missingSupportRationaleDetected !== true;
  addReason(reasons, supportRationalePresent ? "SUPPORT_RATIONALE_PRESENT" : "SUPPORT_RATIONALE_MISSING");
  const conflictRationalePresent = !isConflictType(relationshipType) || input.missingConflictRationaleDetected !== true;
  addReason(reasons, conflictRationalePresent ? "CONFLICT_RATIONALE_PRESENT" : "CONFLICT_RATIONALE_MISSING");
  const conflictSeverity = input.conflictSeverity ?? defaultConflictSeverity(relationshipType);
  const conflictSeverityPresent = !isConflictType(relationshipType) || (conflictSeverity !== undefined && input.missingConflictSeverityDetected !== true);
  addReason(reasons, conflictSeverityPresent ? "CONFLICT_SEVERITY_ASSIGNED" : "CONFLICT_SEVERITY_MISSING");

  const dependencyMapped = !isDependencyType(relationshipType) || input.invalidRelationshipDetected !== true;
  addReason(reasons, dependencyMapped ? "DEPENDENCY_MAPPED" : "DEPENDENCY_INVALID");
  const supportMapped = !isSupportType(relationshipType) || input.invalidRelationshipDetected !== true;
  addReason(reasons, supportMapped ? "SUPPORT_MAPPED" : "SUPPORT_INVALID");
  const conflictMapped = !isConflictType(relationshipType) || input.invalidRelationshipDetected !== true;
  addReason(reasons, conflictMapped ? "CONFLICT_MAPPED" : "CONFLICT_INVALID");

  const rulesDeterministic = input.nonDeterministicRelationshipDetected !== true;
  addReason(reasons, rulesDeterministic ? "RULES_DETERMINISTIC" : "RULES_NON_DETERMINISTIC");

  const graphValid = input.orphanedEdgeDetected !== true
    && input.graphCorruptionDetected !== true
    && sourceKnown
    && targetKnown
    && relationshipTypeValid;
  addReason(reasons, graphValid ? "GRAPH_VALID" : "GRAPH_CORRUPTED");
  const relationshipDirectionValid = input.relationshipDirectionErrorDetected !== true;

  const cycleAbsent = input.cycleDetected !== true;
  addReason(reasons, cycleAbsent ? "CYCLE_ABSENT" : "CYCLE_DETECTED");
  const traversalBounded = input.unboundedTraversalDetected !== true;
  addReason(reasons, traversalBounded ? "TRAVERSAL_BOUNDED" : "TRAVERSAL_UNBOUNDED");

  const tenantIsolationValid = input.crossTenantEdgeDetected !== true
    && input.crossTenantTraversalDetected !== true
    && source.tenant_id === target.tenant_id
    && source.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.rankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.scoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = createBoundaryFlags({
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  addReason(reasons, "EVIDENCE_RELATIONSHIP_GRAPH_IS_NOT_CONTROL");

  const replayResult: TruthReplayResult = input.sourceVerification.replay.replayResult !== "REPRODUCED"
    ? input.sourceVerification.replay.replayResult
    : input.targetVerification.replay.replayResult !== "REPRODUCED"
      ? input.targetVerification.replay.replayResult
      : input.replayMismatchDetected === true
        || input.invalidRelationshipDetected === true
        || input.conflictUndetected === true
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "REPLAY_INCOMPLETE_EVIDENCE"
          : "REPLAY_UNREPLAYABLE",
  );

  const relationship: TruthEvidenceRelationshipGraphContract = Object.freeze({
    graph_id: hashValue("mission-control-evidence-graph-id", {
      tenant_id: input.request.tenant_id,
      mission_id: source.mission_id,
      source_evidence_id: source.evidence_id,
      target_evidence_id: target.evidence_id,
    }),
    relationship_id: hashValue("mission-control-evidence-relationship-id", {
      source_evidence_id: source.evidence_id,
      target_evidence_id: target.evidence_id,
      relationship_type: relationshipType,
    }),
    tenant_id: input.request.tenant_id,
    mission_id: source.mission_id,
    source_evidence_id: source.evidence_id,
    target_evidence_id: target.evidence_id,
    relationship_type: relationshipType,
    relationship_reason: input.relationshipReason ?? input.confidenceRationale ?? "deterministic evidence relationship",
    relationship_confidence: confidence,
    relationship_timestamp: input.request.now,
    evidence_references: Object.freeze([source.evidence_id, target.evidence_id]),
    replay_references: Object.freeze([...new Set([...source.replay_reference_ids, ...target.replay_reference_ids])]),
  });

  const relationshipValid = sourcePresent
    && targetPresent
    && sourceKnown
    && targetKnown
    && relationshipTypeValid
    && relationshipDirectionValid
    && dependencyMapped
    && supportMapped
    && conflictMapped
    && supportRationalePresent
    && conflictRationalePresent
    && conflictSeverityPresent
    && rulesDeterministic
    && graphValid
    && cycleAbsent
    && traversalBounded
    && tenantIsolationValid
    && replayResult === "REPRODUCED"
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");
  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const conditional = !relationshipValid
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && relationshipTypeValid
    && graphValid
    && cycleAbsent
    && traversalBounded
    && tenantIsolationValid
    && replayResult === "REPRODUCED";
  const certification = certificationState(
    relationshipValid && observabilityOperational,
    conditional,
  );
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const failureReason = relationshipValid
    ? null
    : [
      !sourceKnown && "unknown evidence node",
      !targetKnown && "unknown evidence node",
      input.orphanedEdgeDetected === true && "orphaned edge detected",
      !relationshipTypeValid && "invalid relationship type",
      input.relationshipDirectionErrorDetected === true && "relationship direction error",
      !supportRationalePresent && "missing support rationale",
      !conflictRationalePresent && "missing conflict rationale",
      !conflictSeverityPresent && "missing conflict severity",
      input.conflictUndetected === true && "conflict undetected",
      !tenantIsolationValid && "cross-tenant edge blocked",
      replayResult === "MISMATCH" && "graph replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthEvidenceRelationshipGraphLedgerEntry = Object.freeze({
    graph_id: relationship.graph_id,
    relationship_id: relationship.relationship_id,
    tenant_id: relationship.tenant_id,
    mission_id: relationship.mission_id,
    source_evidence_id: relationship.source_evidence_id,
    target_evidence_id: relationship.target_evidence_id,
    relationship_type: relationship.relationship_type,
    conflict_severity: conflictSeverity,
    validation_status: relationshipValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });

  const queries: TruthEvidenceRelationshipGraphQueries = Object.freeze({
    dependencies_by_evidence_id: Object.freeze(isDependencyType(relationshipType) ? [target.evidence_id] : []),
    supporting_evidence_by_evidence_id: Object.freeze(isSupportType(relationshipType) ? [target.evidence_id] : []),
    conflicting_evidence_by_evidence_id: Object.freeze(isConflictType(relationshipType) ? [target.evidence_id] : []),
    evidence_graph_by_mission_id: Object.freeze([source.evidence_id, target.evidence_id]),
    evidence_graph_by_truth_record_id: Object.freeze(input.truthRecordId ? [source.evidence_id, target.evidence_id] : []),
    evidence_path_between_ids: Object.freeze([source.evidence_id, target.evidence_id]),
    evidence_conflict_neighborhood: Object.freeze(isConflictType(relationshipType) ? [source.evidence_id, target.evidence_id] : []),
    evidence_support_neighborhood: Object.freeze(isSupportType(relationshipType) ? [source.evidence_id, target.evidence_id] : []),
  });

  const visibility: TruthEvidenceRelationshipGraphVisibility = Object.freeze({
    graph_id: relationship.graph_id,
    relationship_id: relationship.relationship_id,
    source_evidence_id: relationship.source_evidence_id,
    target_evidence_id: relationship.target_evidence_id,
    relationship_type: relationship.relationship_type,
    relationship_confidence: relationship.relationship_confidence,
    relationship_reason: relationship.relationship_reason,
    conflict_severity: conflictSeverity,
    validation_status: relationshipValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthEvidenceRelationshipGraphObservability = Object.freeze({
    evidence_nodes_total: 2,
    evidence_relationships_total: 1,
    dependency_edges_total: isDependencyType(relationshipType) ? 1 : 0,
    support_edges_total: isSupportType(relationshipType) ? 1 : 0,
    conflict_edges_total: isConflictType(relationshipType) ? 1 : 0,
    graph_validation_failures: relationshipValid ? 0 : 1,
    cycle_detection_failures: cycleAbsent ? 0 : 1,
    conflict_detection_failures: input.conflictUndetected === true ? 1 : 0,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    graph_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthEvidenceRelationshipGraphValidation = Object.freeze({
    valid: relationshipValid || conditional,
    validationState: relationshipValid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    relationshipValid,
    graphValid,
    traversalValid: traversalBounded,
    tenantIsolationValid,
    replayValid: replayResult === "REPRODUCED",
    failClosed,
    deterministic: true,
    readOnly: true,
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    controlSurfaceAbsent,
  });

  const replay: TruthEvidenceRelationshipGraphReplay = Object.freeze({
    replayResult,
    reconstructedRelationship: relationship,
  });

  return Object.freeze({
    request: requestCore(input.request),
    sourceVerification: input.sourceVerification,
    targetVerification: input.targetVerification,
    relationship,
    ledgerEntry,
    queries,
    validation,
    replay,
    visibility,
    observability,
    certification,
    sealed: true,
    readOnly: true,
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
