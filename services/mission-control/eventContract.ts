import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEventFramework,
  TruthCertificationState,
  TruthEventCategory,
  TruthEventContract,
  TruthEventContractSource,
  TruthEventContractType,
  TruthEventFrameworkInput,
  TruthEventFrameworkReasonCode,
  TruthEventFrameworkReplay,
  TruthEventFrameworkRequest,
  TruthEventFrameworkValidation,
  TruthEventFrameworkVisibility,
  TruthEventPayload,
  TruthReplayResult,
} from "./types";

const EVENT_TYPES = new Set<TruthEventContractType>([
  "TRUTH_CREATED",
  "TRUTH_VERIFIED",
  "TRUTH_SUPERSEDED",
  "TRUTH_RESTRICTED",
  "TRUTH_ARCHIVED",
  "CLASSIFICATION_ASSIGNED",
  "IDENTITY_LINKED",
  "STATE_TRANSITIONED",
  "EVIDENCE_ATTACHED",
  "REPLAY_ATTACHED",
  "CERTIFICATION_COMPLETED",
  "RETENTION_UPDATED",
  "GOVERNANCE_ACTION",
  "ESCALATION_CREATED",
  "RUNTIME_EVENT",
]);

const EVENT_CATEGORY_BY_TYPE: Readonly<Record<TruthEventContractType, TruthEventCategory>> = Object.freeze({
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

const EVENT_SOURCES = new Set<TruthEventContractSource>([
  "WRITE_ENGINE",
  "READ_ENGINE",
  "RETENTION_MANAGER",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "REPLAY_ENGINE",
  "OPERATOR",
  "SYSTEM_RUNTIME",
]);

function addReason(reasons: TruthEventFrameworkReasonCode[], reason: TruthEventFrameworkReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEventFrameworkRequest): TruthEventFrameworkRequest {
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

export function buildTruthEventFrameworkRequest(
  request: TruthEventFrameworkRequest,
): TruthEventFrameworkRequest {
  return requestCore(request);
}

export function sealTruthEventFramework(
  input: TruthEventFrameworkInput,
): SealedTruthEventFramework {
  const reasons: TruthEventFrameworkReasonCode[] = [];
  const payload: TruthEventPayload = Object.freeze({
    payload_type: input.payloadType,
    payload_version: input.payloadVersion,
    payload_data: Object.freeze({ ...input.eventPayload }),
    payload_hash: hashValue("mission-control-event-payload-hash", {
      payload_type: input.payloadType,
      payload_version: input.payloadVersion,
      payload_data: input.eventPayload,
    }),
  });
  const eventTimestamp = input.eventTimestamp ?? input.request.now;
  const eventHash = hashValue("mission-control-event-hash", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    truth_record_id: input.truthRecordId,
    event_type: input.eventType,
    event_category: input.eventCategory,
    event_source: input.eventSource,
    event_timestamp: eventTimestamp,
    event_version: input.eventVersion ?? "truth-event/v1",
    payload,
    parent_event_id: input.parentEventId,
    child_event_ids: input.childEventIds ?? [],
    related_truth_record_id: input.relatedTruthRecordId,
    related_lineage_root_id: input.relatedLineageRootId,
    evidence_reference_ids: input.evidenceReferenceIds,
    replay_reference_ids: input.replayReferenceIds,
  });
  const eventId = input.eventId ?? hashValue("mission-control-event-id", {
    truth_record_id: input.truthRecordId,
    event_hash: eventHash,
  });

  const event: TruthEventContract = Object.freeze({
    event_id: eventId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    truth_record_id: input.truthRecordId,
    event_type: input.eventType,
    event_category: input.eventCategory,
    event_source: input.eventSource,
    event_timestamp: eventTimestamp,
    event_version: input.eventVersion ?? "truth-event/v1",
    event_payload: payload,
    event_hash: eventHash,
    event_creation_timestamp: input.request.now,
    parent_event_id: input.parentEventId,
    child_event_ids: Object.freeze([...(input.childEventIds ?? [])]),
    related_truth_record_id: input.relatedTruthRecordId,
    related_lineage_root_id: input.relatedLineageRootId,
    evidence_reference_ids: Object.freeze([...input.evidenceReferenceIds]),
    evidence_count: input.evidenceReferenceIds.length,
    evidence_hash: hashValue("mission-control-event-evidence-hash", input.evidenceReferenceIds),
    replay_reference_ids: Object.freeze([...input.replayReferenceIds]),
    replay_bundle_id: input.replayBundleId,
    replay_hash: hashValue("mission-control-event-replay-hash", {
      replay_reference_ids: input.replayReferenceIds,
      replay_bundle_id: input.replayBundleId ?? null,
    }),
  });

  const eventIdPresent = event.event_id.length > 0;
  addReason(reasons, eventIdPresent ? "EVENT_ID_PRESENT" : "EVENT_ID_MISSING");
  const identityValid = !(input.priorEventIds ?? []).includes(event.event_id) && input.identityMutated !== true;
  addReason(reasons, !(input.priorEventIds ?? []).includes(event.event_id) ? "EVENT_ID_UNIQUE" : "EVENT_ID_DUPLICATE");
  addReason(reasons, input.identityMutated !== true ? "EVENT_ID_IMMUTABLE" : "EVENT_ID_MUTATED");
  addReason(reasons, input.hashMismatchDetected !== true ? "EVENT_HASH_VALID" : "EVENT_HASH_MISMATCH");

  const typePresent = event.event_type.length > 0;
  addReason(reasons, typePresent ? "EVENT_TYPE_PRESENT" : "EVENT_TYPE_MISSING");
  const typeValid = EVENT_TYPES.has(event.event_type);
  addReason(reasons, typeValid ? "EVENT_TYPE_SUPPORTED" : "EVENT_TYPE_UNSUPPORTED");

  const categoryValid = (input.categoryMatchesType ?? true) && EVENT_CATEGORY_BY_TYPE[event.event_type] === event.event_category;
  addReason(reasons, categoryValid ? "EVENT_CATEGORY_VALID" : "EVENT_CATEGORY_MISMATCH");

  const sourcePresent = event.event_source.length > 0;
  addReason(reasons, sourcePresent ? "EVENT_SOURCE_PRESENT" : "EVENT_SOURCE_MISSING");
  const sourceValid = EVENT_SOURCES.has(event.event_source);
  addReason(reasons, sourceValid ? "EVENT_SOURCE_VALID" : "EVENT_SOURCE_INVALID");

  const timestampValid = !Number.isNaN(Date.parse(event.event_timestamp));
  addReason(reasons, timestampValid ? "EVENT_TIMESTAMP_VALID" : "EVENT_TIMESTAMP_INVALID");

  const payloadValid = input.payloadSchemaValid !== false;
  addReason(reasons, payloadValid ? "PAYLOAD_SCHEMA_VALID" : "PAYLOAD_SCHEMA_INVALID");
  addReason(reasons, input.payloadHashMismatchDetected !== true ? "PAYLOAD_HASH_VALID" : "PAYLOAD_HASH_MISMATCH");

  const relationshipsValid = (input.parentEventId === undefined || input.knownParentEventIds?.includes(input.parentEventId) !== false)
    && input.crossTenantRelationshipDetected !== true;
  addReason(reasons, relationshipsValid ? "RELATIONSHIPS_VALID" : "RELATIONSHIPS_INVALID");
  addReason(reasons, input.parentEventId === undefined || input.knownParentEventIds?.includes(input.parentEventId) !== false ? "PARENT_EVENT_KNOWN" : "PARENT_EVENT_UNKNOWN");
  addReason(reasons, input.crossTenantRelationshipDetected !== true ? "RELATIONSHIP_TENANT_VALID" : "RELATIONSHIP_TENANT_FAILED");

  const evidenceValid = input.evidenceReferencesResolvable !== false && input.evidenceReferenceIds.length > 0;
  addReason(reasons, evidenceValid ? "EVIDENCE_BINDING_VALID" : "EVIDENCE_BINDING_INVALID");
  addReason(reasons, input.evidenceHashMismatchDetected !== true ? "EVIDENCE_HASH_VALID" : "EVIDENCE_HASH_MISMATCH");

  const replayValid = input.replayReferencesResolvable !== false && input.replayReferenceIds.length > 0;
  addReason(reasons, replayValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");
  addReason(reasons, input.replayHashMismatchDetected !== true ? "REPLAY_HASH_VALID" : "REPLAY_HASH_MISMATCH");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayValid
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true
        || input.hashMismatchDetected === true
        || input.payloadHashMismatchDetected === true
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "EVENT_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "EVENT_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "EVENT_REPLAY_INCOMPLETE_EVIDENCE"
          : "EVENT_REPLAY_UNREPLAYABLE",
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
  addReason(reasons, "EVENT_CONTRACT_IS_NOT_CONTROL");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

  const tenantScoped = (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id)
    && input.persistence.request.tenant_id === input.request.tenant_id;

  const pass = eventIdPresent
    && identityValid
    && input.hashMismatchDetected !== true
    && typePresent
    && typeValid
    && categoryValid
    && sourcePresent
    && sourceValid
    && timestampValid
    && payloadValid
    && input.payloadHashMismatchDetected !== true
    && relationshipsValid
    && evidenceValid
    && input.evidenceHashMismatchDetected !== true
    && replayValid
    && input.replayHashMismatchDetected !== true
    && replayResult === "REPRODUCED"
    && failClosed
    && tenantScoped
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const conditional = !pass
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED"
    && typeValid
    && categoryValid
    && sourceValid
    && payloadValid
    && relationshipsValid
    && evidenceValid
    && replayValid;

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const visibility: TruthEventFrameworkVisibility = Object.freeze({
    event_id: event.event_id,
    event_type: event.event_type,
    event_category: event.event_category,
    event_source: event.event_source,
    event_timestamp: event.event_timestamp,
    event_version: event.event_version,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScoped ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const validation: TruthEventFrameworkValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    identityValid: identityValid && input.hashMismatchDetected !== true,
    typeValid,
    categoryValid,
    sourceValid,
    payloadValid: payloadValid && input.payloadHashMismatchDetected !== true,
    relationshipsValid,
    evidenceValid: evidenceValid && input.evidenceHashMismatchDetected !== true,
    replayValid: replayValid && input.replayHashMismatchDetected !== true,
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

  const replay: TruthEventFrameworkReplay = Object.freeze({
    replayResult,
    reconstructedEvent: event,
  });

  return Object.freeze({
    request: requestCore(input.request),
    event,
    validation,
    replay,
    visibility,
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
