import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthRecommendationRecorder,
  TruthCertificationState,
  TruthRecommendationLineage,
  TruthRecommendationRecordClassification,
  TruthRecommendationRecordContract,
  TruthRecommendationRecordRelationship,
  TruthRecommendationRecordType,
  TruthRecommendationRecorderInput,
  TruthRecommendationRecorderLedgerEntry,
  TruthRecommendationRecorderObservability,
  TruthRecommendationRecorderReasonCode,
  TruthRecommendationRecorderReplay,
  TruthRecommendationRecorderRequest,
  TruthRecommendationRecorderValidation,
  TruthRecommendationRecorderVisibility,
  TruthReplayResult,
} from "./types";

const RECORD_TYPES = new Set<TruthRecommendationRecordType>([
  "RECOMMENDATION",
  "ALTERNATIVE",
  "REJECTED_OPTION",
]);

const CLASSIFICATIONS = new Set<TruthRecommendationRecordClassification>([
  "PRIMARY",
  "ALTERNATIVE",
  "REJECTED",
]);

const RELATIONSHIP_TYPES = new Set([
  "ALTERNATIVE_TO",
  "REJECTED_FROM",
  "SUPERSEDES",
  "DERIVED_FROM",
  "SUPPORTS",
]);

function addReason(reasons: TruthRecommendationRecorderReasonCode[], reason: TruthRecommendationRecorderReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthRecommendationRecorderRequest): TruthRecommendationRecorderRequest {
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

function inferClassification(recordType: TruthRecommendationRecordType): TruthRecommendationRecordClassification {
  if (recordType === "RECOMMENDATION") return "PRIMARY";
  if (recordType === "ALTERNATIVE") return "ALTERNATIVE";
  return "REJECTED";
}

function countByType(prior: readonly TruthRecommendationRecorderLedgerEntry[], type: TruthRecommendationRecordType): number {
  return prior.filter((entry) => entry.record_type === type && entry.record_state === "RECORDED").length;
}

export function buildTruthRecommendationRecorderRequest(
  request: TruthRecommendationRecorderRequest,
): TruthRecommendationRecorderRequest {
  return requestCore(request);
}

export function sealTruthRecommendationRecorder(
  input: TruthRecommendationRecorderInput,
): SealedTruthRecommendationRecorder {
  const reasons: TruthRecommendationRecorderReasonCode[] = [];
  const priorRecords = input.priorRecords ?? [];
  const recommendation = input.recommendation.recommendation;
  const recordTimestamp = input.recordTimestamp ?? input.request.now;
  const recordId = input.recordId ?? hashValue("mission-control-recommendation-record-id", {
    recommendation_id: recommendation.recommendation_id,
    record_type: input.recordType,
    record_timestamp: recordTimestamp,
  });
  const classification = input.classification ?? inferClassification(input.recordType);
  const lineage: TruthRecommendationLineage = Object.freeze({
    origin_recommendation_id: input.lineage?.origin_recommendation_id ?? recommendation.recommendation_id,
    parent_recommendation_id: input.lineage?.parent_recommendation_id ?? input.alternativeRecommendationId,
    superseded_by_recommendation_id: input.lineage?.superseded_by_recommendation_id,
    alternative_lineage_ids: Object.freeze([...(input.lineage?.alternative_lineage_ids ?? [])]),
    rejected_lineage_ids: Object.freeze([...(input.lineage?.rejected_lineage_ids ?? [])]),
  });
  const relationships = Object.freeze([...(input.relationships ?? [])]);

  const recordIdPresent = recordId.length > 0;
  addReason(reasons, recordIdPresent ? "RECORD_ID_PRESENT" : "RECORD_ID_MISSING");
  const recommendationIdPresent = recommendation.recommendation_id.length > 0;
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");

  const recordTypePresent = input.recordType.length > 0;
  addReason(reasons, recordTypePresent ? "RECORD_TYPE_PRESENT" : "RECORD_TYPE_MISSING");
  const recordTypeValid = RECORD_TYPES.has(input.recordType);
  addReason(reasons, recordTypeValid ? "RECORD_TYPE_VALID" : "RECORD_TYPE_INVALID");
  const recordTimestampValid = !Number.isNaN(Date.parse(recordTimestamp));
  addReason(reasons, recordTimestampValid ? "RECORD_TIMESTAMP_VALID" : "RECORD_TIMESTAMP_INVALID");

  const recommendationContentPresent = Object.keys(input.recommendationContent ?? { recommendation_id: recommendation.recommendation_id }).length > 0
    && input.missingRecommendationContentDetected !== true;
  addReason(reasons, recommendationContentPresent ? "RECOMMENDATION_CONTENT_PRESENT" : "RECOMMENDATION_CONTENT_MISSING");
  const recommendationRationalePresent = recommendation.recommendation_payload.recommendation_rationale.trim().length > 0
    && input.missingRationaleDetected !== true;
  addReason(reasons, recommendationRationalePresent ? "RECOMMENDATION_RATIONALE_PRESENT" : "RECOMMENDATION_RATIONALE_MISSING");

  const alternativeLinked = input.recordType !== "ALTERNATIVE"
    || (input.unlinkedAlternativeDetected !== true
      && input.alternativeRecommendationId !== undefined
      && (input.knownRecommendationIds?.includes(input.alternativeRecommendationId) ?? true));
  addReason(reasons, alternativeLinked ? "ALTERNATIVE_LINKED" : "ALTERNATIVE_UNLINKED");

  const rejectionRationalePresent = input.recordType !== "REJECTED_OPTION"
    || ((input.rejectionRationale?.trim().length ?? 0) > 0 && input.missingRejectionRationaleDetected !== true);
  addReason(reasons, rejectionRationalePresent ? "REJECTION_RATIONALE_PRESENT" : "REJECTION_RATIONALE_MISSING");
  const rejectionEvidencePresent = input.recordType !== "REJECTED_OPTION"
    || ((input.rejectionEvidenceIds?.length ?? 0) > 0 && input.missingRejectionEvidenceDetected !== true);
  addReason(reasons, rejectionEvidencePresent ? "REJECTION_EVIDENCE_PRESENT" : "REJECTION_EVIDENCE_MISSING");

  const classificationSingle = input.multipleClassificationsDetected !== true;
  addReason(reasons, classificationSingle ? "CLASSIFICATION_SINGLE" : "CLASSIFICATION_MULTIPLE");
  const classificationValid = classificationSingle
    && CLASSIFICATIONS.has(classification)
    && input.unknownClassificationDetected !== true
    && classification === inferClassification(input.recordType);
  addReason(reasons, classificationValid ? "CLASSIFICATION_VALID" : "CLASSIFICATION_INVALID");

  const lineageBroken = input.brokenLineageChainDetected === true;
  const lineageOrphaned = input.orphanedRecommendationDetected === true;
  const lineageValid = !lineageBroken
    && !lineageOrphaned
    && lineage.origin_recommendation_id.length > 0
    && (input.recordType === "RECOMMENDATION" || lineage.parent_recommendation_id !== undefined);
  addReason(reasons, lineageValid ? "LINEAGE_VALID" : lineageBroken ? "LINEAGE_BROKEN" : "LINEAGE_ORPHANED");

  const recommendationValid = input.recommendation.validation.valid && input.invalidRecommendationDetected !== true;
  addReason(reasons, recommendationValid ? "RECOMMENDATION_VALID" : "RECOMMENDATION_INVALID");
  const evidenceValid = input.invalidEvidenceDetected !== true
    && recommendation.supporting_evidence_ids.length > 0
    && recommendation.supporting_evidence_ids.every((id) => input.knownEvidenceIds?.includes(id) ?? true);
  addReason(reasons, evidenceValid ? "EVIDENCE_VALID" : "EVIDENCE_INVALID");
  const governanceValid = input.invalidGovernanceDetected !== true && recommendation.governance_binding.authority_scope.includes("ADVISORY");
  addReason(reasons, governanceValid ? "GOVERNANCE_VALID" : "GOVERNANCE_INVALID");
  const confidenceValid = input.invalidConfidenceDetected !== true && recommendation.confidence_binding.confidence_evidence.length > 0;
  addReason(reasons, confidenceValid ? "CONFIDENCE_VALID" : "CONFIDENCE_INVALID");

  const relationshipsValid = relationships.every((relationship) => (
    RELATIONSHIP_TYPES.has(relationship.relationship_type)
    && relationship.target_recommendation_id.length > 0
    && relationship.relationship_rationale.length > 0
  )) && input.unknownRelationshipTypeDetected !== true
    && input.relationshipCorruptionDetected !== true;
  addReason(reasons, relationshipsValid ? "RELATIONSHIPS_VALID" : "RELATIONSHIPS_INVALID");

  const replayBindingValid = input.replayReferencesResolvable !== false
    && recommendation.replay_reference_ids.length > 0;
  addReason(reasons, replayBindingValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");

  const transactionProtected = input.partialRecordDetected !== true && input.rollbackFailed !== true;
  addReason(reasons, transactionProtected ? "TRANSACTION_PROTECTED" : "PARTIAL_RECORD_DETECTED");
  if (input.rollbackFailed === true) addReason(reasons, "ROLLBACK_FAILED");

  const tenantIsolationValid = input.crossTenantRecommendationAccessDetected !== true
    && input.crossTenantLineageTraversalDetected !== true
    && recommendation.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayBindingValid
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true
        || input.classificationMismatchDetected === true
        || input.lineageMismatchDetected === true
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

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

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
  addReason(reasons, "RECOMMENDATION_RECORDER_IS_NOT_CONTROL");

  const recorded = recordIdPresent
    && recommendationIdPresent
    && recordTypePresent
    && recordTypeValid
    && recordTimestampValid
    && recommendationContentPresent
    && recommendationRationalePresent
    && alternativeLinked
    && rejectionRationalePresent
    && rejectionEvidencePresent
    && classificationValid
    && lineageValid
    && recommendationValid
    && evidenceValid
    && governanceValid
    && confidenceValid
    && relationshipsValid
    && replayBindingValid
    && transactionProtected
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

  const record: TruthRecommendationRecordContract = Object.freeze({
    record_id: recordId,
    recommendation_id: recommendation.recommendation_id,
    tenant_id: recommendation.tenant_id,
    mission_id: recommendation.mission_id,
    record_timestamp: recordTimestamp,
    record_type: input.recordType,
    record_state: recorded ? "RECORDED" : "REJECTED",
    recommendation_hash: recommendation.recommendation_hash,
    evidence_references: Object.freeze([...recommendation.supporting_evidence_ids]),
    replay_references: Object.freeze([...recommendation.replay_reference_ids]),
  });

  const failureReason = recorded
    ? null
    : [
      !recommendationContentPresent && "missing recommendation content",
      !recommendationRationalePresent && "missing rationale",
      !alternativeLinked && "unlinked alternative",
      !rejectionRationalePresent && "missing rejection rationale",
      !rejectionEvidencePresent && "missing rejection evidence",
      !classificationValid && "invalid classification accepted",
      !lineageValid && "broken lineage",
      !transactionProtected && "partial recording committed",
      !tenantIsolationValid && "cross-tenant recommendation access",
      replayResult === "MISMATCH" && "replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthRecommendationRecorderLedgerEntry = Object.freeze({
    record_id: record.record_id,
    recommendation_id: record.recommendation_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    record_type: record.record_type,
    classification,
    record_state: record.record_state,
    validation_status: recorded ? "VALID" : "INVALID",
    lineage_status: lineageValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    transaction_status: recorded
      ? "COMMITTED"
      : transactionProtected
        ? "ROLLED_BACK"
        : "NOT_STARTED",
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const tenantScopedVisibility = tenantIsolationValid;
  const visibility: TruthRecommendationRecorderVisibility = Object.freeze({
    recommendation_id: record.recommendation_id,
    record_type: record.record_type,
    classification,
    record_state: record.record_state,
    confidence_state: recommendation.confidence_binding.confidence_state,
    validation_status: recorded ? "VALID" : "INVALID",
    lineage_status: lineageValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: record.record_timestamp,
    readOnly: true,
    tenantScoped: tenantScopedVisibility,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScopedVisibility ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const observability: TruthRecommendationRecorderObservability = Object.freeze({
    recommendations_recorded_total: countByType(priorRecords, "RECOMMENDATION") + (recorded && input.recordType === "RECOMMENDATION" ? 1 : 0),
    alternatives_recorded_total: countByType(priorRecords, "ALTERNATIVE") + (recorded && input.recordType === "ALTERNATIVE" ? 1 : 0),
    rejected_options_recorded_total: countByType(priorRecords, "REJECTED_OPTION") + (recorded && input.recordType === "REJECTED_OPTION" ? 1 : 0),
    classification_failures: classificationValid ? 0 : 1,
    validation_failures: recorded ? 0 : 1,
    lineage_failures: lineageValid ? 0 : 1,
    transaction_failures: transactionProtected ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  const conditional = recorded
    && !observabilityOperational
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED";
  const certification = certificationState(
    recorded && observabilityOperational && replayResult === "REPRODUCED",
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

  const validation: TruthRecommendationRecorderValidation = Object.freeze({
    valid: recorded || conditional,
    validationState: recorded || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    recommendationValid: recommendationValid && evidenceValid && governanceValid && confidenceValid,
    classificationValid,
    lineageValid,
    transactionProtected,
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

  const replay: TruthRecommendationRecorderReplay = Object.freeze({
    replayResult,
    reconstructedRecord: record,
    reconstructedLineage: lineage,
    reconstructedRelationships: relationships,
  });

  return Object.freeze({
    request: requestCore(input.request),
    recommendation: input.recommendation,
    record,
    classification,
    lineage,
    relationships,
    ledgerEntry,
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
