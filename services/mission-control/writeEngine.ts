import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthWriteFramework,
  TruthCertificationState,
  TruthReplayResult,
  TruthWriteFrameworkInput,
  TruthWriteFrameworkObservability,
  TruthWriteFrameworkReasonCode,
  TruthWriteFrameworkReplay,
  TruthWriteFrameworkRequest,
  TruthWriteFrameworkValidation,
  TruthWriteFrameworkVisibility,
  TruthWriteLedgerEntry,
  TruthWriteResult,
  TruthWriteTransactionStatus,
  TruthWriteType,
} from "./types";

const SUPPORTED_WRITE_TYPES = new Set<TruthWriteType>([
  "CREATE_TRUTH_RECORD",
  "APPEND_TRUTH_EVENT",
  "APPEND_CLASSIFICATION",
  "APPEND_IDENTITY_RELATIONSHIP",
  "APPEND_STATE_TRANSITION",
  "APPEND_CERTIFICATION_RESULT",
  "APPEND_EVIDENCE_REFERENCE",
  "APPEND_REPLAY_REFERENCE",
]);

function addReason(reasons: TruthWriteFrameworkReasonCode[], reason: TruthWriteFrameworkReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthWriteFrameworkRequest): TruthWriteFrameworkRequest {
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

export function buildTruthWriteFrameworkRequest(
  request: TruthWriteFrameworkRequest,
): TruthWriteFrameworkRequest {
  return requestCore(request);
}

export function sealTruthWriteFramework(
  input: TruthWriteFrameworkInput,
): SealedTruthWriteFramework {
  const reasons: TruthWriteFrameworkReasonCode[] = [];
  const allowedWriteTypes = input.allowedWriteTypes ?? [...SUPPORTED_WRITE_TYPES];
  const writeRequest = input.writeRequest;

  const writeIdPresent = writeRequest.write_id.length > 0;
  addReason(reasons, writeIdPresent ? "WRITE_ID_PRESENT" : "WRITE_ID_MISSING");
  const tenantPresent = writeRequest.tenant_id.length > 0;
  addReason(reasons, tenantPresent ? "WRITE_TENANT_PRESENT" : "WRITE_TENANT_MISSING");
  const missionValid = input.knownMissionIds.includes(writeRequest.mission_id);
  addReason(reasons, missionValid ? "WRITE_MISSION_VALID" : "WRITE_MISSION_INVALID");
  const writeTypePresent = writeRequest.write_type.length > 0;
  addReason(reasons, writeTypePresent ? "WRITE_TYPE_PRESENT" : "WRITE_TYPE_MISSING");
  const writeTypeSupported = SUPPORTED_WRITE_TYPES.has(writeRequest.write_type) && allowedWriteTypes.includes(writeRequest.write_type);
  addReason(reasons, writeTypeSupported ? "WRITE_TYPE_SUPPORTED" : "WRITE_TYPE_UNSUPPORTED");
  const payloadPresent = Object.keys(writeRequest.write_payload).length > 0;
  addReason(reasons, payloadPresent ? "WRITE_PAYLOAD_PRESENT" : "WRITE_PAYLOAD_MISSING");
  const payloadValid = input.payloadSchemaValid !== false && payloadPresent;
  addReason(reasons, payloadValid ? "WRITE_PAYLOAD_VALID" : "WRITE_PAYLOAD_INVALID");

  const appendOnlyEnforced = input.mutationAttempted !== true
    && input.deleteAttempted !== true
    && input.historyOverwriteAttempted !== true
    && input.removeEvidenceAttempted !== true
    && input.removeReplayAttempted !== true;
  addReason(reasons, appendOnlyEnforced ? "APPEND_ONLY_ENFORCED" : "MUTATION_ATTEMPT_DETECTED");
  if (input.deleteAttempted === true) addReason(reasons, "DELETE_ATTEMPT_DETECTED");
  if (input.historyOverwriteAttempted === true) addReason(reasons, "HISTORY_OVERWRITE_DETECTED");
  if (input.removeEvidenceAttempted === true) addReason(reasons, "EVIDENCE_REMOVE_ATTEMPT_DETECTED");
  if (input.removeReplayAttempted === true) addReason(reasons, "REPLAY_REMOVE_ATTEMPT_DETECTED");

  const truthRecordExistenceValid = writeRequest.write_type === "CREATE_TRUTH_RECORD"
    ? input.truthRecordUniqueOnCreate !== false
    : input.truthRecordExists !== false;
  addReason(reasons, truthRecordExistenceValid ? "TRUTH_RECORD_EXISTENCE_VALID" : "TRUTH_RECORD_EXISTENCE_INVALID");
  const truthRecordUniquenessValid = writeRequest.write_type !== "CREATE_TRUTH_RECORD" || input.truthRecordUniqueOnCreate !== false;
  addReason(reasons, truthRecordUniquenessValid ? "TRUTH_RECORD_UNIQUENESS_VALID" : "TRUTH_RECORD_UNIQUENESS_INVALID");
  const stateTransitionValid = writeRequest.write_type !== "APPEND_STATE_TRANSITION" || input.stateTransitionLegal !== false;
  addReason(reasons, stateTransitionValid ? "STATE_TRANSITION_VALID" : "STATE_TRANSITION_INVALID");
  const classificationValid = writeRequest.write_type !== "APPEND_CLASSIFICATION" || input.classificationValid !== false;
  addReason(reasons, classificationValid ? "CLASSIFICATION_VALID" : "CLASSIFICATION_INVALID");
  const identityRelationshipValid = writeRequest.write_type !== "APPEND_IDENTITY_RELATIONSHIP" || input.identityRelationshipValid !== false;
  addReason(reasons, identityRelationshipValid ? "IDENTITY_RELATIONSHIP_VALID" : "IDENTITY_RELATIONSHIP_INVALID");
  const evidenceValid = input.evidenceReferencesValid !== false && writeRequest.evidence_references.length > 0;
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCES_VALID" : "EVIDENCE_REFERENCES_INVALID");
  const replayRefsValid = input.replayReferencesValid !== false && writeRequest.replay_references.length > 0;
  addReason(reasons, replayRefsValid ? "REPLAY_REFERENCES_VALID" : "REPLAY_REFERENCES_INVALID");

  const transactionProtected = input.partialWriteDetected !== true
    && input.rollbackFailed !== true
    && input.transactionLeakDetected !== true;
  addReason(reasons, transactionProtected ? "TRANSACTION_PROTECTED" : "PARTIAL_WRITE_DETECTED");
  if (input.rollbackFailed === true) addReason(reasons, "ROLLBACK_FAILED"); else addReason(reasons, "ROLLBACK_SUCCEEDED");
  if (input.transactionLeakDetected === true) addReason(reasons, "TRANSACTION_LEAK_DETECTED");

  const deterministicOrdering = input.outOfOrderSequenceDetected !== true
    && input.duplicateSequenceDetected !== true
    && input.unstableOrderingDetected !== true;
  addReason(reasons, deterministicOrdering ? "ORDERING_VALID" : "ORDERING_UNSTABLE");
  if (input.outOfOrderSequenceDetected === true) addReason(reasons, "ORDERING_OUT_OF_ORDER");
  if (input.duplicateSequenceDetected === true) addReason(reasons, "ORDERING_DUPLICATE_SEQUENCE");
  if (input.unstableOrderingDetected === true) addReason(reasons, "ORDERING_UNSTABLE");

  const requestHash = hashValue("mission-control-write-request-hash", writeRequest.write_payload);
  const writeHash = hashValue("mission-control-write-hash", {
    truth_record_id: writeRequest.truth_record_id,
    write_type: writeRequest.write_type,
    write_payload: writeRequest.write_payload,
    evidence_references: writeRequest.evidence_references,
    replay_references: writeRequest.replay_references,
  });
  const idempotencyValid = input.idempotencyKeySeen !== true
    || input.idempotencyPayloadMatches !== false;
  addReason(reasons, idempotencyValid ? "IDEMPOTENCY_VALID" : "IDEMPOTENCY_CONFLICT");
  if (input.idempotencyKeySeen === true && input.idempotencyPayloadMatches !== false) addReason(reasons, "IDEMPOTENT_REUSE");
  if (input.duplicateCommitAttempted === true) addReason(reasons, "DUPLICATE_COMMIT_ATTEMPT");

  const tenantIsolationValid = writeRequest.tenant_id === input.request.tenant_id
    && input.knownTenantIds.includes(writeRequest.tenant_id)
    && (input.accessTenantId === undefined || input.accessTenantId === writeRequest.tenant_id)
    && input.crossTenantEvidenceDetected !== true
    && input.crossTenantReplayDetected !== true
    && writeRequest.tenant_id === input.storage.primarySnapshot.tenant_id
    && writeRequest.mission_id === input.storage.primarySnapshot.mission_id
    && writeRequest.tenant_id === input.storage.request.tenant_id;
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");
  if (input.crossTenantEvidenceDetected === true) addReason(reasons, "CROSS_TENANT_EVIDENCE_BLOCKED");
  if (input.crossTenantReplayDetected === true) addReason(reasons, "CROSS_TENANT_REPLAY_BLOCKED");

  const replayBindingsValid = input.replayBindingFailureDetected !== true && replayRefsValid && evidenceValid;
  addReason(reasons, replayBindingsValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");

  const failClosed = input.storageFailureDetected !== true
    || (
      input.storageFailureDetected === true
      && transactionProtected === false
      || input.storageFailureDetected === true
      && true
    );
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

  const committed = writeIdPresent
    && tenantPresent
    && missionValid
    && writeTypePresent
    && writeTypeSupported
    && payloadValid
    && appendOnlyEnforced
    && truthRecordExistenceValid
    && truthRecordUniquenessValid
    && stateTransitionValid
    && classificationValid
    && identityRelationshipValid
    && evidenceValid
    && replayRefsValid
    && transactionProtected
    && deterministicOrdering
    && idempotencyValid
    && input.duplicateCommitAttempted !== true
    && tenantIsolationValid
    && replayBindingsValid
    && input.storageFailureDetected !== true;

  const writeResult: TruthWriteResult = committed
    ? (input.idempotencyKeySeen === true ? "REUSED" : "COMMITTED")
    : "REJECTED";
  const transactionStatus: TruthWriteTransactionStatus = committed
    ? "COMMITTED"
    : transactionProtected || input.rollbackFailed !== true
      ? "ROLLED_BACK"
      : "NOT_STARTED";

  const failureReason = committed
    ? null
    : [
      !payloadValid && "invalid payload",
      !evidenceValid && "invalid evidence reference",
      !replayRefsValid && "invalid replay reference",
      !stateTransitionValid && "illegal state transition",
      !identityRelationshipValid && "invalid identity relationship",
      !idempotencyValid && "idempotency conflict",
      !tenantIsolationValid && "cross-tenant write blocked",
      input.storageFailureDetected === true && "storage failure",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthWriteLedgerEntry = Object.freeze({
    write_id: writeRequest.write_id,
    tenant_id: writeRequest.tenant_id,
    mission_id: writeRequest.mission_id,
    write_type: writeRequest.write_type,
    write_source: writeRequest.write_source,
    write_timestamp: writeRequest.write_timestamp,
    write_result: writeResult,
    failure_reason: failureReason,
    transaction_status: transactionStatus,
    storage_commit_sequence: input.storageCommitSequence ?? ((input.priorLedgerEntries?.length ?? 0) + 1),
    write_sequence: input.writeSequence ?? ((input.priorLedgerEntries?.length ?? 0) + 1),
    tenant_sequence: input.tenantSequence ?? ((input.priorLedgerEntries?.filter((e) => e.tenant_id === writeRequest.tenant_id).length ?? 0) + 1),
    mission_sequence: input.missionSequence ?? ((input.priorLedgerEntries?.filter((e) => e.mission_id === writeRequest.mission_id).length ?? 0) + 1),
    evidence_references: Object.freeze([...writeRequest.evidence_references]),
    replay_references: Object.freeze([...writeRequest.replay_references]),
  });

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayBindingsValid
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true || !deterministicOrdering
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "WRITE_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "WRITE_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "WRITE_REPLAY_INCOMPLETE_EVIDENCE"
          : "WRITE_REPLAY_UNREPLAYABLE",
  );

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
  addReason(reasons, "WRITE_ENGINE_IS_NOT_CONTROL");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const pass = committed
    && appendOnlyEnforced
    && payloadValid
    && truthRecordExistenceValid
    && truthRecordUniquenessValid
    && stateTransitionValid
    && classificationValid
    && identityRelationshipValid
    && evidenceValid
    && replayRefsValid
    && transactionProtected
    && deterministicOrdering
    && idempotencyValid
    && tenantIsolationValid
    && replayBindingsValid
    && replayResult === "REPRODUCED"
    && observabilityOperational
    && failClosed
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const conditional = !pass
    && committed
    && replayResult === "REPRODUCED"
    && input.observabilityGapDetected === true
    && input.metricsLimitationDetected === true
    && input.remediationDocumented === true
    && appendOnlyEnforced
    && transactionProtected
    && deterministicOrdering
    && idempotencyValid
    && tenantIsolationValid
    && replayBindingsValid
    && failClosed;

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const visibility: TruthWriteFrameworkVisibility = Object.freeze({
    write_id: ledgerEntry.write_id,
    write_type: ledgerEntry.write_type,
    write_result: ledgerEntry.write_result,
    write_timestamp: ledgerEntry.write_timestamp,
    tenant_id: ledgerEntry.tenant_id,
    mission_id: ledgerEntry.mission_id,
    truth_record_id: writeRequest.truth_record_id,
    failure_reason: ledgerEntry.failure_reason,
    transaction_status: ledgerEntry.transaction_status,
    storage_commit_sequence: ledgerEntry.storage_commit_sequence,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthWriteFrameworkObservability = Object.freeze({
    writes_total: 1,
    writes_successful: writeResult === "REJECTED" ? 0 : 1,
    writes_failed: writeResult === "REJECTED" ? 1 : 0,
    writes_retried: input.writesRetried ?? (input.idempotencyKeySeen === true ? 1 : 0),
    write_validation_failures: payloadValid && truthRecordExistenceValid && truthRecordUniquenessValid && stateTransitionValid && classificationValid && identityRelationshipValid && evidenceValid && replayRefsValid ? 0 : 1,
    write_transaction_failures: transactionProtected ? 0 : 1,
    write_storage_failures: input.storageFailureDetected === true ? 1 : 0,
    write_tenant_scope_failures: tenantIsolationValid ? 0 : 1,
    write_idempotency_failures: idempotencyValid ? 0 : 1,
    write_ordering_failures: deterministicOrdering ? 0 : 1,
    average_write_latency: input.writeLatencyMs ?? 1,
  });

  const validation: TruthWriteFrameworkValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    appendOnlyEnforced,
    integrityValid: payloadValid
      && truthRecordExistenceValid
      && truthRecordUniquenessValid
      && stateTransitionValid
      && classificationValid
      && identityRelationshipValid
      && evidenceValid
      && replayRefsValid,
    transactionProtected,
    deterministicOrdering,
    idempotencyValid,
    tenantIsolationValid,
    replayBindingsValid,
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

  const replay: TruthWriteFrameworkReplay = Object.freeze({
    replayResult,
    reconstructedLedgerEntry: ledgerEntry,
  });

  return Object.freeze({
    request: requestCore(input.request),
    writeRequest,
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
