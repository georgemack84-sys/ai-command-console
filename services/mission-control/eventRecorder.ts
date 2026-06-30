import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildTruthEventFrameworkRequest, sealTruthEventFramework } from "./eventContract";
import type {
  SealedTruthEventRecorderFramework,
  TruthCertificationState,
  TruthEventCategory,
  TruthEventContract,
  TruthEventContractSource,
  TruthEventContractType,
  TruthEventRecorderInput,
  TruthEventRecorderKind,
  TruthEventRecorderObservability,
  TruthEventRecorderReasonCode,
  TruthEventRecorderReplay,
  TruthEventRecorderRequest,
  TruthEventRecorderValidation,
  TruthEventRecorderVisibility,
  TruthEventRecordingContract,
  TruthEventRecorderLedgerEntry,
  TruthReplayResult,
  TruthRuntimeEventState,
} from "./types";

const EVENT_CATEGORY_BY_TYPE: Readonly<Record<string, TruthEventCategory>> = Object.freeze({
  TRUTH_CREATED: "TRUTH",
  TRUTH_VERIFIED: "TRUTH",
  TRUTH_SUPERSEDED: "TRUTH",
  TRUTH_RESTRICTED: "TRUTH",
  TRUTH_ARCHIVED: "TRUTH",
  CLASSIFICATION_ASSIGNED: "CLASSIFICATION",
  IDENTITY_LINKED: "IDENTITY",
  STATE_TRANSITIONED: "STATE",
  EVIDENCE_ATTACHED: "EVIDENCE",
  REPLAY_ATTACHED: "REPLAY",
  CERTIFICATION_COMPLETED: "CERTIFICATION",
  RETENTION_UPDATED: "RETENTION",
  GOVERNANCE_ACTION: "GOVERNANCE",
  ESCALATION_CREATED: "ESCALATION",
  RUNTIME_EVENT: "RUNTIME",
});

const SYSTEM_SOURCES = new Set<string>([
  "WRITE_ENGINE",
  "READ_ENGINE",
  "RETENTION_MANAGER",
  "CERTIFICATION_ENGINE",
  "REPLAY_ENGINE",
]);

const RUNTIME_STATES = new Set<TruthRuntimeEventState>([
  "STARTED",
  "STOPPED",
  "RESTRICTED",
  "SUSPENDED",
  "RECOVERED",
  "ERROR",
  "HEALTH_CHANGED",
  "BOUNDARY_EVENT",
]);

function addReason(reasons: TruthEventRecorderReasonCode[], reason: TruthEventRecorderReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEventRecorderRequest): TruthEventRecorderRequest {
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

function normalizeSource(input: TruthEventRecorderInput): string {
  if (input.recorderKind === "USER") return input.rawEvent.eventSource ?? "OPERATOR";
  if (input.recorderKind === "SYSTEM") return input.rawEvent.systemSource ?? input.rawEvent.eventSource ?? "";
  if (input.recorderKind === "GOVERNANCE") return input.rawEvent.eventSource ?? "GOVERNANCE_ENGINE";
  return input.rawEvent.runtimeSource ?? input.rawEvent.eventSource ?? "SYSTEM_RUNTIME";
}

function normalizeCategory(eventType: string, explicitCategory?: string): string {
  return explicitCategory ?? EVENT_CATEGORY_BY_TYPE[eventType] ?? "TRUTH";
}

function normalizePayload(input: TruthEventRecorderInput): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {
    recorder_kind: input.recorderKind,
  };
  if (input.rawEvent.actorId) metadata.actor_id = input.rawEvent.actorId;
  if (input.rawEvent.action) metadata.action = input.rawEvent.action;
  if (input.rawEvent.componentId) metadata.component_id = input.rawEvent.componentId;
  if (input.rawEvent.operation) metadata.operation = input.rawEvent.operation;
  if (input.rawEvent.operationResult) metadata.operation_result = input.rawEvent.operationResult;
  if (input.rawEvent.governanceAuthority) metadata.governance_authority = input.rawEvent.governanceAuthority;
  if (input.rawEvent.governanceScope) metadata.governance_scope = input.rawEvent.governanceScope;
  if (input.rawEvent.runtimeIdentity) metadata.runtime_identity = input.rawEvent.runtimeIdentity;
  if (input.rawEvent.runtimeState) metadata.runtime_state = input.rawEvent.runtimeState;
  if (input.rawEvent.runtimeResult) metadata.runtime_result = input.rawEvent.runtimeResult;

  const extras = Object.fromEntries(
    Object.entries(input.rawEvent.unknownFields ?? {}).sort(([left], [right]) => left.localeCompare(right)),
  );

  return Object.freeze({
    ...input.rawEvent.payload,
    ...metadata,
    ...extras,
  });
}

function isPrimitivePayload(payload: Record<string, unknown>): boolean {
  return Object.values(payload).every((value) => ["string", "number", "boolean"].includes(typeof value));
}

function countByKind(prior: readonly TruthEventRecorderLedgerEntry[], kind: TruthEventRecorderKind): number {
  return prior.filter((entry) => entry.recording_kind === kind && entry.recording_state === "RECORDED").length;
}

function maxOf(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

export function buildTruthEventRecorderRequest(
  request: TruthEventRecorderRequest,
): TruthEventRecorderRequest {
  return requestCore(request);
}

export function sealTruthEventRecorderFramework(
  input: TruthEventRecorderInput,
): SealedTruthEventRecorderFramework {
  const reasons: TruthEventRecorderReasonCode[] = [];
  const priorRecordings = input.priorRecordings ?? [];
  const source = normalizeSource(input);
  const category = normalizeCategory(input.rawEvent.eventType, input.rawEvent.eventCategory);
  const normalizedPayload = normalizePayload(input);

  const tenantValid = input.knownTenantIds.includes(input.request.tenant_id)
    && input.request.tenant_id === input.persistence.request.tenant_id;
  addReason(reasons, tenantValid ? "TENANT_VALID" : "TENANT_INVALID");
  const missionValid = input.knownMissionIds.includes(input.rawEvent.missionId);
  addReason(reasons, missionValid ? "MISSION_VALID" : "MISSION_INVALID");

  const userActorPresent = input.recorderKind !== "USER" || Boolean(input.rawEvent.actorId);
  addReason(reasons, userActorPresent ? "USER_ACTOR_PRESENT" : "USER_ACTOR_MISSING");
  const userActorTenantValid = input.recorderKind !== "USER"
    || input.rawEvent.actorTenantId === undefined
    || input.rawEvent.actorTenantId === input.request.tenant_id;
  addReason(reasons, userActorTenantValid ? "USER_ACTOR_TENANT_VALID" : "USER_ACTOR_TENANT_FAILED");
  const userActionPresent = input.recorderKind !== "USER" || Boolean(input.rawEvent.action);
  addReason(reasons, userActionPresent ? "USER_ACTION_PRESENT" : "USER_ACTION_MISSING");

  const systemSourceValid = input.recorderKind !== "SYSTEM" || SYSTEM_SOURCES.has(source);
  addReason(reasons, systemSourceValid ? "SYSTEM_SOURCE_VALID" : "SYSTEM_SOURCE_INVALID");
  const systemComponentPresent = input.recorderKind !== "SYSTEM" || Boolean(input.rawEvent.componentId);
  addReason(reasons, systemComponentPresent ? "SYSTEM_COMPONENT_PRESENT" : "SYSTEM_COMPONENT_MISSING");
  const systemOperationPresent = input.recorderKind !== "SYSTEM" || Boolean(input.rawEvent.operation);
  addReason(reasons, systemOperationPresent ? "SYSTEM_OPERATION_PRESENT" : "SYSTEM_OPERATION_MISSING");
  const systemResultPresent = input.recorderKind !== "SYSTEM" || Boolean(input.rawEvent.operationResult);
  addReason(reasons, systemResultPresent ? "SYSTEM_RESULT_PRESENT" : "SYSTEM_RESULT_MISSING");

  const governanceAuthorityPresent = input.recorderKind !== "GOVERNANCE" || Boolean(input.rawEvent.governanceAuthority);
  addReason(reasons, governanceAuthorityPresent ? "GOVERNANCE_AUTHORITY_PRESENT" : "GOVERNANCE_AUTHORITY_MISSING");
  const governanceRationalePresent = input.recorderKind !== "GOVERNANCE" || Boolean(input.rawEvent.governanceRationale);
  addReason(reasons, governanceRationalePresent ? "GOVERNANCE_RATIONALE_PRESENT" : "GOVERNANCE_RATIONALE_MISSING");
  const governanceEvidencePresent = input.recorderKind !== "GOVERNANCE" || input.rawEvent.evidenceReferenceIds.length > 0;
  addReason(reasons, governanceEvidencePresent ? "GOVERNANCE_EVIDENCE_PRESENT" : "GOVERNANCE_EVIDENCE_MISSING");
  const governanceScopePresent = input.recorderKind !== "GOVERNANCE" || Boolean(input.rawEvent.governanceScope);
  addReason(reasons, governanceScopePresent ? "GOVERNANCE_SCOPE_PRESENT" : "GOVERNANCE_SCOPE_MISSING");

  const runtimeIdentityPresent = input.recorderKind !== "RUNTIME" || Boolean(input.rawEvent.runtimeIdentity);
  addReason(reasons, runtimeIdentityPresent ? "RUNTIME_IDENTITY_PRESENT" : "RUNTIME_IDENTITY_MISSING");
  const runtimeStateValid = input.recorderKind !== "RUNTIME" || RUNTIME_STATES.has((input.rawEvent.runtimeState ?? "") as TruthRuntimeEventState);
  addReason(reasons, runtimeStateValid ? "RUNTIME_STATE_VALID" : "RUNTIME_STATE_INVALID");
  const runtimeResultPresent = input.recorderKind !== "RUNTIME" || Boolean(input.rawEvent.runtimeResult);
  addReason(reasons, runtimeResultPresent ? "RUNTIME_RESULT_PRESENT" : "RUNTIME_RESULT_MISSING");
  const recorderKindValid = userActorPresent
    && userActorTenantValid
    && userActionPresent
    && systemSourceValid
    && systemComponentPresent
    && systemOperationPresent
    && systemResultPresent
    && governanceAuthorityPresent
    && governanceRationalePresent
    && governanceEvidencePresent
    && governanceScopePresent
    && runtimeIdentityPresent
    && runtimeStateValid
    && runtimeResultPresent;

  const normalizedSourcePresent = source.length > 0;
  addReason(reasons, normalizedSourcePresent ? "EVENT_SOURCE_PRESENT" : "EVENT_SOURCE_MISSING");
  const normalizedCategoryPresent = category.length > 0;
  addReason(reasons, normalizedCategoryPresent ? "EVENT_CATEGORY_PRESENT" : "EVENT_CATEGORY_MISSING");

  const evidenceRefsValid = input.rawEvent.evidenceReferenceIds.length > 0
    && input.rawEvent.evidenceReferenceIds.every((referenceId) => input.evidenceCatalog.some((reference) => (
      reference.referenceId === referenceId
      && reference.tenantId === input.request.tenant_id
      && reference.immutable
      && reference.auditable
      && reference.accessible
      && reference.resolvable !== false
    )));
  addReason(reasons, evidenceRefsValid ? "EVIDENCE_REFERENCES_VALID" : "EVIDENCE_REFERENCES_INVALID");
  const replayRefsValid = input.rawEvent.replayReferenceIds.length > 0
    && input.rawEvent.replayReferenceIds.every((referenceId) => input.replayCatalog.some((reference) => (
      reference.referenceId === referenceId
      && reference.tenantId === input.request.tenant_id
      && reference.immutable
      && reference.auditable
      && reference.accessible
      && reference.deterministic === true
      && reference.resolvable !== false
    )));
  addReason(reasons, replayRefsValid ? "REPLAY_REFERENCES_VALID" : "REPLAY_REFERENCES_INVALID");

  const payloadSchemaValid = input.payloadSchemaValid !== false
    && Object.keys(normalizedPayload).length > 0
    && isPrimitivePayload(normalizedPayload);

  const categoryMatchesType = EVENT_CATEGORY_BY_TYPE[input.rawEvent.eventType] === undefined
    ? false
    : category === EVENT_CATEGORY_BY_TYPE[input.rawEvent.eventType];
  const sourceLooksValid = normalizedSourcePresent;
  addReason(reasons, sourceLooksValid ? "EVENT_SOURCE_VALID" : "EVENT_SOURCE_INVALID");
  addReason(reasons, categoryMatchesType ? "EVENT_CATEGORY_VALID" : "EVENT_CATEGORY_INVALID");

  const normalizationValid = input.normalizationFailureDetected !== true
    && normalizedSourcePresent
    && normalizedCategoryPresent
    && payloadSchemaValid;
  addReason(reasons, normalizationValid ? "NORMALIZATION_VALID" : "NORMALIZATION_FAILED");

  const normalizedEvent = sealTruthEventFramework({
    request: buildTruthEventFrameworkRequest({
      tenant_id: input.request.tenant_id,
      now: input.request.now,
    }),
    persistence: input.persistence,
    eventId: undefined,
    missionId: input.rawEvent.missionId,
    truthRecordId: input.rawEvent.truthRecordId,
    eventType: input.rawEvent.eventType as TruthEventContractType,
    eventCategory: category as TruthEventCategory,
    eventSource: source as TruthEventContractSource,
    eventTimestamp: input.rawEvent.eventTimestamp,
    eventPayload: normalizedPayload,
    payloadType: input.rawEvent.payloadType,
    payloadVersion: input.rawEvent.payloadVersion,
    parentEventId: input.rawEvent.parentEventId,
    childEventIds: input.rawEvent.childEventIds,
    relatedTruthRecordId: input.rawEvent.relatedTruthRecordId,
    relatedLineageRootId: input.rawEvent.relatedLineageRootId,
    evidenceReferenceIds: input.rawEvent.evidenceReferenceIds,
    replayReferenceIds: input.rawEvent.replayReferenceIds,
    replayBundleId: input.rawEvent.replayBundleId,
    priorEventIds: input.priorEventIds,
    knownParentEventIds: input.knownParentEventIds,
    categoryMatchesType,
    payloadSchemaValid,
    evidenceReferencesResolvable: evidenceRefsValid,
    replayReferencesResolvable: replayRefsValid,
    accessTenantId: input.accessTenantId,
    observabilityGapDetected: input.observabilityGapDetected,
    remediationDocumented: input.remediationDocumented,
    executionRequested: input.executionRequested,
    approvalRequested: input.approvalRequested,
    rankingRequested: input.rankingRequested,
    prioritizationRequested: input.prioritizationRequested,
    scoringRequested: input.scoringRequested,
    resourceAllocationRequested: input.resourceAllocationRequested,
    authorityExpansionDetected: input.authorityExpansionDetected,
  });

  const eventContractValid = normalizedEvent.validation.valid && input.eventContractMismatchDetected !== true;
  addReason(reasons, eventContractValid ? "EVENT_CONTRACT_VALID" : "EVENT_CONTRACT_MISMATCH");

  const integrityValid = tenantValid
    && missionValid
    && normalizedEvent.validation.identityValid
    && normalizedEvent.validation.typeValid
    && normalizedEvent.validation.categoryValid
    && normalizedEvent.validation.sourceValid
    && normalizedEvent.validation.payloadValid
    && evidenceRefsValid
    && replayRefsValid;
  addReason(reasons, integrityValid ? "EVENT_INTEGRITY_VALID" : "EVENT_INTEGRITY_INVALID");

  const maxEventSequence = maxOf(priorRecordings.map((entry) => entry.event_sequence));
  const maxStorageCommitSequence = maxOf(priorRecordings.map((entry) => entry.storage_commit_sequence));
  const maxTenantSequence = maxOf(
    priorRecordings
      .filter((entry) => entry.tenant_id === input.request.tenant_id)
      .map((entry) => entry.tenant_sequence),
  );
  const maxMissionSequence = maxOf(
    priorRecordings
      .filter((entry) => entry.mission_id === input.rawEvent.missionId)
      .map((entry) => entry.mission_sequence),
  );

  const eventSequence = input.eventSequence ?? (maxEventSequence + 1);
  const tenantSequence = input.tenantSequence ?? (maxTenantSequence + 1);
  const missionSequence = input.missionSequence ?? (maxMissionSequence + 1);
  const storageCommitSequence = input.storageCommitSequence ?? (maxStorageCommitSequence + 1);

  const duplicateSequence = input.duplicateSequenceDetected === true
    || priorRecordings.some((entry) => entry.event_sequence === eventSequence)
    || priorRecordings.some((entry) => entry.storage_commit_sequence === storageCommitSequence)
    || priorRecordings.some((entry) => entry.tenant_id === input.request.tenant_id && entry.tenant_sequence === tenantSequence)
    || priorRecordings.some((entry) => entry.mission_id === input.rawEvent.missionId && entry.mission_sequence === missionSequence);
  const outOfOrderSequence = input.outOfOrderSequenceDetected === true
    || eventSequence <= maxEventSequence
    || storageCommitSequence <= maxStorageCommitSequence
    || tenantSequence <= maxTenantSequence
    || missionSequence <= maxMissionSequence;
  const orderingValid = !duplicateSequence
    && !outOfOrderSequence
    && input.unstableOrderingDetected !== true;
  addReason(reasons, orderingValid ? "ORDERING_VALID" : duplicateSequence ? "ORDERING_DUPLICATE_SEQUENCE" : outOfOrderSequence ? "ORDERING_OUT_OF_ORDER" : "ORDERING_UNSTABLE");

  const transactionProtected = input.partialRecordDetected !== true
    && input.rollbackFailed !== true
    && input.transactionLeakDetected !== true;
  addReason(reasons, transactionProtected ? "TRANSACTION_PROTECTED" : "PARTIAL_RECORD_DETECTED");
  if (input.rollbackFailed === true) addReason(reasons, "ROLLBACK_FAILED");
  if (input.transactionLeakDetected === true) addReason(reasons, "TRANSACTION_LEAK_DETECTED");

  const tenantIsolationValid = normalizedEvent.visibility.tenantScoped
    && userActorTenantValid
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

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
  addReason(reasons, "EVENT_RECORDER_IS_NOT_CONTROL");

  const committed = normalizationValid
    && eventContractValid
    && integrityValid
    && recorderKindValid
    && orderingValid
    && transactionProtected
    && tenantIsolationValid
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const recordingState = committed ? "RECORDED" : "REJECTED";
  const failureReason = committed
    ? null
    : [
      !userActorPresent && "missing actor",
      !userActionPresent && "missing action",
      !systemSourceValid && "unknown system source",
      !systemComponentPresent && "missing component identity",
      !systemResultPresent && "missing operation result",
      !governanceAuthorityPresent && "missing governance authority",
      !governanceRationalePresent && "missing rationale",
      !governanceEvidencePresent && "missing evidence",
      !runtimeIdentityPresent && "missing runtime identity",
      !runtimeStateValid && "unknown runtime state",
      !runtimeResultPresent && "missing runtime result",
      !normalizationValid && "normalization failure",
      !eventContractValid && "event contract mismatch",
      !integrityValid && "event integrity invalid",
      !orderingValid && "deterministic ordering failure",
      !transactionProtected && "transaction protection failure",
      !tenantIsolationValid && "cross-tenant event blocked",
    ].filter(Boolean).join("; ");

  const recording: TruthEventRecordingContract = Object.freeze({
    recording_id: input.rawEvent.recordingId ?? hashValue("mission-control-recording-id", {
      event_id: normalizedEvent.event.event_id,
      recording_timestamp: input.request.now,
      recorder_kind: input.recorderKind,
    }),
    event_id: normalizedEvent.event.event_id,
    tenant_id: input.request.tenant_id,
    mission_id: input.rawEvent.missionId,
    truth_record_id: input.rawEvent.truthRecordId,
    event_type: normalizedEvent.event.event_type,
    event_category: normalizedEvent.event.event_category,
    event_source: normalizedEvent.event.event_source,
    recording_timestamp: input.request.now,
    recording_payload: Object.freeze({ ...normalizedPayload }),
    evidence_references: Object.freeze([...input.rawEvent.evidenceReferenceIds]),
    replay_references: Object.freeze([...input.rawEvent.replayReferenceIds]),
    recording_state: recordingState,
  });

  addReason(reasons, recording.recording_id.length > 0 ? "RECORDING_ID_PRESENT" : "RECORDING_ID_MISSING");
  addReason(reasons, recording.event_id.length > 0 ? "EVENT_ID_PRESENT" : "EVENT_ID_MISSING");

  const replayResult: TruthReplayResult = !evidenceRefsValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayRefsValid
      ? "UNREPLAYABLE"
      : input.recordingMismatchDetected === true
        || input.normalizationMismatchDetected === true
        || input.sequenceMismatchDetected === true
        || normalizedEvent.replay.replayResult === "MISMATCH"
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

  const ledgerEntry: TruthEventRecorderLedgerEntry = Object.freeze({
    recording_id: recording.recording_id,
    recording_kind: input.recorderKind,
    event_id: recording.event_id,
    tenant_id: recording.tenant_id,
    mission_id: recording.mission_id,
    truth_record_id: recording.truth_record_id,
    event_type: recording.event_type,
    event_category: recording.event_category,
    event_source: recording.event_source,
    recording_timestamp: recording.recording_timestamp,
    recording_state: recording.recording_state,
    transaction_status: committed
      ? "COMMITTED"
      : transactionProtected
        ? "ROLLED_BACK"
        : "NOT_STARTED",
    validation_status: committed ? "VALID" : "INVALID",
    failure_reason: failureReason,
    event_sequence: eventSequence,
    tenant_sequence: tenantSequence,
    mission_sequence: missionSequence,
    storage_commit_sequence: storageCommitSequence,
    evidence_references: Object.freeze([...recording.evidence_references]),
    replay_references: Object.freeze([...recording.replay_references]),
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const tenantScopedVisibility = tenantIsolationValid;
  const visibility: TruthEventRecorderVisibility = Object.freeze({
    recording_id: recording.recording_id,
    event_id: recording.event_id,
    event_category: recording.event_category,
    event_source: recording.event_source,
    recording_state: recording.recording_state,
    recording_timestamp: recording.recording_timestamp,
    validation_status: committed ? "VALID" : "INVALID",
    failure_reason: failureReason,
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantScopedVisibility,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScopedVisibility ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const observability: TruthEventRecorderObservability = Object.freeze({
    events_recorded_total: priorRecordings.filter((entry) => entry.recording_state === "RECORDED").length + (committed ? 1 : 0),
    user_events_recorded: countByKind(priorRecordings, "USER") + (committed && input.recorderKind === "USER" ? 1 : 0),
    system_events_recorded: countByKind(priorRecordings, "SYSTEM") + (committed && input.recorderKind === "SYSTEM" ? 1 : 0),
    governance_events_recorded: countByKind(priorRecordings, "GOVERNANCE") + (committed && input.recorderKind === "GOVERNANCE" ? 1 : 0),
    runtime_events_recorded: countByKind(priorRecordings, "RUNTIME") + (committed && input.recorderKind === "RUNTIME" ? 1 : 0),
    event_recording_failures: priorRecordings.filter((entry) => entry.recording_state === "REJECTED").length + (committed ? 0 : 1),
    normalization_failures: (input.normalizationFailureDetected === true ? 1 : 0) + (input.eventContractMismatchDetected === true ? 1 : 0),
    validation_failures: committed ? 0 : 1,
    transaction_failures: transactionProtected ? 0 : 1,
    tenant_scope_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const conditional = committed
    && !observabilityOperational
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED";
  const certification = certificationState(
    committed && observabilityOperational && replayResult === "REPRODUCED",
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

  const validation: TruthEventRecorderValidation = Object.freeze({
    valid: committed || conditional,
    validationState: committed || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    normalizationValid,
    contractValid: eventContractValid,
    integrityValid,
    orderingValid,
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

  const replay: TruthEventRecorderReplay = Object.freeze({
    replayResult,
    rawEvent: Object.freeze({ ...input.rawEvent }),
    normalizedEvent: normalizedEvent.event as TruthEventContract,
    reconstructedRecording: recording,
  });

  return Object.freeze({
    request: requestCore(input.request),
    recorderKind: input.recorderKind,
    rawEvent: Object.freeze({ ...input.rawEvent }),
    normalizedEvent,
    recording,
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
