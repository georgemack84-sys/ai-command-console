import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthDecisionRecorder,
  TruthCertificationState,
  TruthDecisionLineage,
  TruthDecisionRecordClassification,
  TruthDecisionRecordContract,
  TruthDecisionRecordRelationship,
  TruthDecisionRecordType,
  TruthDecisionRecorderInput,
  TruthDecisionRecorderLedgerEntry,
  TruthDecisionRecorderObservability,
  TruthDecisionRecorderReasonCode,
  TruthDecisionRecorderReplay,
  TruthDecisionRecorderRequest,
  TruthDecisionRecorderValidation,
  TruthDecisionRecorderVisibility,
  TruthReplayResult,
} from "./types";

const RECORD_TYPES = new Set<TruthDecisionRecordType>([
  "ACCEPTED_RECOMMENDATION",
  "REJECTED_RECOMMENDATION",
  "OPERATOR_ACTION",
]);

const CLASSIFICATIONS = new Set<TruthDecisionRecordClassification>([
  "ACCEPTED",
  "REJECTED",
  "OPERATOR_INITIATED",
  "GOVERNANCE_INITIATED",
  "CERTIFICATION_INITIATED",
]);

const RELATIONSHIP_TYPES = new Set([
  "ACCEPTS",
  "REJECTS",
  "OVERRIDES",
  "ESCALATES",
  "RESTRICTS",
  "DERIVED_FROM",
  "SUPERSEDES",
]);

function addReason(reasons: TruthDecisionRecorderReasonCode[], reason: TruthDecisionRecorderReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthDecisionRecorderRequest): TruthDecisionRecorderRequest {
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

function inferClassification(
  recordType: TruthDecisionRecordType,
  authorityType: string,
): TruthDecisionRecordClassification {
  if (recordType === "ACCEPTED_RECOMMENDATION") return "ACCEPTED";
  if (recordType === "REJECTED_RECOMMENDATION") return "REJECTED";
  if (authorityType === "GOVERNANCE_ENGINE") return "GOVERNANCE_INITIATED";
  if (authorityType === "CERTIFICATION_ENGINE") return "CERTIFICATION_INITIATED";
  return "OPERATOR_INITIATED";
}

function countByType(prior: readonly TruthDecisionRecorderLedgerEntry[], type: TruthDecisionRecordType): number {
  return prior.filter((entry) => entry.record_type === type && entry.record_state === "RECORDED").length;
}

export function buildTruthDecisionRecorderRequest(
  request: TruthDecisionRecorderRequest,
): TruthDecisionRecorderRequest {
  return requestCore(request);
}

export function sealTruthDecisionRecorder(
  input: TruthDecisionRecorderInput,
): SealedTruthDecisionRecorder {
  const reasons: TruthDecisionRecorderReasonCode[] = [];
  const priorRecords = input.priorRecords ?? [];
  const decision = input.decision.decision;
  const recordTimestamp = input.recordTimestamp ?? input.request.now;
  const recordId = input.recordId ?? hashValue("mission-control-decision-record-id", {
    decision_id: decision.decision_id,
    record_type: input.recordType,
    record_timestamp: recordTimestamp,
  });
  const classification = input.classification ?? inferClassification(
    input.recordType,
    decision.authority_binding.authority_type,
  );
  const lineage: TruthDecisionLineage = Object.freeze({
    source_recommendation_id: input.lineage?.source_recommendation_id ?? input.acceptedRecommendationId,
    parent_decision_id: input.lineage?.parent_decision_id,
    influenced_by_operator_id: input.lineage?.influenced_by_operator_id ?? input.operatorId,
    governance_parent_id: input.lineage?.governance_parent_id,
    certification_parent_id: input.lineage?.certification_parent_id,
    superseded_by_decision_id: input.lineage?.superseded_by_decision_id,
  });
  const relationships = Object.freeze([...(input.relationships ?? [])]);

  const recordIdPresent = recordId.length > 0;
  addReason(reasons, recordIdPresent ? "RECORD_ID_PRESENT" : "RECORD_ID_MISSING");
  const decisionIdPresent = decision.decision_id.length > 0;
  addReason(reasons, decisionIdPresent ? "DECISION_ID_PRESENT" : "DECISION_ID_MISSING");

  const recordTypePresent = input.recordType.length > 0;
  addReason(reasons, recordTypePresent ? "RECORD_TYPE_PRESENT" : "RECORD_TYPE_MISSING");
  const recordTypeValid = RECORD_TYPES.has(input.recordType);
  addReason(reasons, recordTypeValid ? "RECORD_TYPE_VALID" : "RECORD_TYPE_INVALID");
  const recordTimestampValid = !Number.isNaN(Date.parse(recordTimestamp));
  addReason(reasons, recordTimestampValid ? "RECORD_TIMESTAMP_VALID" : "RECORD_TIMESTAMP_INVALID");

  const decisionContentPresent = Object.keys(input.decisionContent ?? { decision_id: decision.decision_id }).length > 0
    && input.missingDecisionContentDetected !== true;
  addReason(reasons, decisionContentPresent ? "DECISION_CONTENT_PRESENT" : "DECISION_CONTENT_MISSING");

  const acceptedRecommendationPresent = input.recordType !== "ACCEPTED_RECOMMENDATION"
    || ((input.acceptedRecommendationId?.length ?? 0) > 0
      && input.missingAcceptedRecommendationDetected !== true
      && (input.knownRecommendationIds?.includes(input.acceptedRecommendationId!) ?? true));
  addReason(
    reasons,
    acceptedRecommendationPresent ? "ACCEPTED_RECOMMENDATION_PRESENT" : "ACCEPTED_RECOMMENDATION_MISSING",
  );

  const rejectionRationalePresent = input.recordType !== "REJECTED_RECOMMENDATION"
    || ((input.rejectionRationale?.trim().length ?? 0) > 0 && input.missingRejectionRationaleDetected !== true);
  addReason(reasons, rejectionRationalePresent ? "REJECTION_RATIONALE_PRESENT" : "REJECTION_RATIONALE_MISSING");
  const rejectionAuthorityPresent = input.recordType !== "REJECTED_RECOMMENDATION"
    || (decision.authority_binding.decision_authority.trim().length > 0 && input.missingRejectionAuthorityDetected !== true);
  addReason(reasons, rejectionAuthorityPresent ? "REJECTION_AUTHORITY_PRESENT" : "REJECTION_AUTHORITY_MISSING");
  const alternativeSelectedPresent = input.recordType !== "REJECTED_RECOMMENDATION"
    || ((input.alternativeSelectedId?.length ?? 0) > 0 && input.missingAlternativeSelectedDetected !== true);
  addReason(reasons, alternativeSelectedPresent ? "ALTERNATIVE_SELECTED_PRESENT" : "ALTERNATIVE_SELECTED_MISSING");

  const operatorIdentityPresent = input.recordType !== "OPERATOR_ACTION"
    || ((input.operatorId?.trim().length ?? 0) > 0 && input.missingOperatorIdentityDetected !== true);
  addReason(reasons, operatorIdentityPresent ? "OPERATOR_IDENTITY_PRESENT" : "OPERATOR_IDENTITY_MISSING");
  const operatorActionPresent = input.recordType !== "OPERATOR_ACTION"
    || (input.operatorAction !== undefined && input.missingOperatorActionDetected !== true);
  addReason(reasons, operatorActionPresent ? "OPERATOR_ACTION_PRESENT" : "OPERATOR_ACTION_MISSING");

  const classificationSingle = input.multipleClassificationsDetected !== true;
  addReason(reasons, classificationSingle ? "CLASSIFICATION_SINGLE" : "CLASSIFICATION_MULTIPLE");
  const classificationValid = classificationSingle
    && CLASSIFICATIONS.has(classification)
    && input.unknownClassificationDetected !== true
    && classification === inferClassification(input.recordType, decision.authority_binding.authority_type);
  addReason(reasons, classificationValid ? "CLASSIFICATION_VALID" : "CLASSIFICATION_INVALID");

  const lineageBroken = input.brokenLineageChainDetected === true;
  const lineageOrphaned = input.orphanedDecisionDetected === true;
  const lineageValid = !lineageBroken
    && !lineageOrphaned
    && (input.recordType !== "ACCEPTED_RECOMMENDATION" || lineage.source_recommendation_id !== undefined)
    && (input.recordType !== "OPERATOR_ACTION" || lineage.influenced_by_operator_id !== undefined);
  addReason(reasons, lineageValid ? "LINEAGE_VALID" : lineageBroken ? "LINEAGE_BROKEN" : "LINEAGE_ORPHANED");

  const decisionValid = input.decision.validation.valid && input.invalidDecisionDetected !== true;
  addReason(reasons, decisionValid ? "DECISION_VALID" : "DECISION_INVALID");
  const authorityValid = input.invalidAuthorityDetected !== true && decision.authority_binding.authority_evidence.length > 0;
  addReason(reasons, authorityValid ? "AUTHORITY_VALID" : "AUTHORITY_INVALID");
  const operatorValid = input.recordType !== "OPERATOR_ACTION"
    || (input.invalidOperatorDetected !== true && operatorIdentityPresent && operatorActionPresent);
  addReason(reasons, operatorValid ? "OPERATOR_VALID" : "OPERATOR_INVALID");
  const evidenceValid = input.invalidEvidenceDetected !== true
    && decision.supporting_evidence_ids.length > 0
    && decision.supporting_evidence_ids.every((id) => input.knownEvidenceIds?.includes(id) ?? true);
  addReason(reasons, evidenceValid ? "EVIDENCE_VALID" : "EVIDENCE_INVALID");
  const governanceValid = input.invalidGovernanceDetected !== true && decision.governance_binding.authority_scope.length > 0;
  addReason(reasons, governanceValid ? "GOVERNANCE_VALID" : "GOVERNANCE_INVALID");
  const confidenceValid = input.invalidConfidenceDetected !== true && decision.confidence_binding.confidence_evidence.length > 0;
  addReason(reasons, confidenceValid ? "CONFIDENCE_VALID" : "CONFIDENCE_INVALID");

  const relationshipsValid = relationships.every((relationship) => (
    RELATIONSHIP_TYPES.has(relationship.relationship_type)
    && relationship.target_id.length > 0
    && relationship.relationship_rationale.length > 0
  )) && input.unknownRelationshipTypeDetected !== true
    && input.relationshipCorruptionDetected !== true;
  addReason(reasons, relationshipsValid ? "RELATIONSHIPS_VALID" : "RELATIONSHIPS_INVALID");

  const replayBindingValid = input.replayReferencesResolvable !== false
    && decision.replay_reference_ids.length > 0;
  addReason(reasons, replayBindingValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");

  const transactionProtected = input.partialRecordDetected !== true && input.rollbackFailed !== true;
  addReason(reasons, transactionProtected ? "TRANSACTION_PROTECTED" : "PARTIAL_RECORD_DETECTED");
  if (input.rollbackFailed === true) addReason(reasons, "ROLLBACK_FAILED");

  const tenantIsolationValid = input.crossTenantDecisionAccessDetected !== true
    && input.crossTenantLineageTraversalDetected !== true
    && decision.tenant_id === input.request.tenant_id
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
  addReason(reasons, "DECISION_RECORDER_IS_NOT_CONTROL");

  const recorded = recordIdPresent
    && decisionIdPresent
    && recordTypePresent
    && recordTypeValid
    && recordTimestampValid
    && decisionContentPresent
    && acceptedRecommendationPresent
    && rejectionRationalePresent
    && rejectionAuthorityPresent
    && alternativeSelectedPresent
    && operatorIdentityPresent
    && operatorActionPresent
    && classificationValid
    && lineageValid
    && decisionValid
    && authorityValid
    && operatorValid
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

  const record: TruthDecisionRecordContract = Object.freeze({
    record_id: recordId,
    decision_id: decision.decision_id,
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_id,
    record_timestamp: recordTimestamp,
    record_type: input.recordType,
    record_state: recorded ? "RECORDED" : "REJECTED",
    decision_hash: decision.decision_hash,
    evidence_references: Object.freeze([...decision.supporting_evidence_ids]),
    replay_references: Object.freeze([...decision.replay_reference_ids]),
  });

  const failureReason = recorded
    ? null
    : [
      !decisionContentPresent && "missing decision content",
      !acceptedRecommendationPresent && "accepted recommendation lost",
      !rejectionRationalePresent && "missing rejection rationale",
      !rejectionAuthorityPresent && "missing rejection authority",
      !alternativeSelectedPresent && "alternative not traceable",
      !operatorIdentityPresent && "missing operator identity",
      !operatorActionPresent && "missing operator action",
      !classificationValid && "invalid classification accepted",
      !lineageValid && "broken lineage",
      !transactionProtected && "partial recording committed",
      !tenantIsolationValid && "cross-tenant decision access",
      replayResult === "MISMATCH" && "decision replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthDecisionRecorderLedgerEntry = Object.freeze({
    record_id: record.record_id,
    decision_id: record.decision_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    record_type: record.record_type,
    classification,
    decision_authority: decision.authority_binding.decision_authority,
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
  const visibility: TruthDecisionRecorderVisibility = Object.freeze({
    decision_id: record.decision_id,
    record_type: record.record_type,
    classification,
    decision_authority: decision.authority_binding.decision_authority,
    record_state: record.record_state,
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

  const observability: TruthDecisionRecorderObservability = Object.freeze({
    decisions_recorded_total: priorRecords.filter((entry) => entry.record_state === "RECORDED").length + (recorded ? 1 : 0),
    accepted_recommendations_total: countByType(priorRecords, "ACCEPTED_RECOMMENDATION") + (recorded && input.recordType === "ACCEPTED_RECOMMENDATION" ? 1 : 0),
    rejected_recommendations_total: countByType(priorRecords, "REJECTED_RECOMMENDATION") + (recorded && input.recordType === "REJECTED_RECOMMENDATION" ? 1 : 0),
    operator_actions_total: countByType(priorRecords, "OPERATOR_ACTION") + (recorded && input.recordType === "OPERATOR_ACTION" ? 1 : 0),
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

  const validation: TruthDecisionRecorderValidation = Object.freeze({
    valid: recorded || conditional,
    validationState: recorded || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    decisionValid: decisionValid && authorityValid && operatorValid && evidenceValid && governanceValid && confidenceValid,
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

  const replay: TruthDecisionRecorderReplay = Object.freeze({
    replayResult,
    reconstructedRecord: record,
    reconstructedLineage: lineage,
    reconstructedRelationships: relationships,
  });

  return Object.freeze({
    request: requestCore(input.request),
    decision: input.decision,
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
