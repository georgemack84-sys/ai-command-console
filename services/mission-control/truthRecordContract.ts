import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthRecordContract,
  TruthCatalogReference,
  TruthCertificationState,
  TruthEventSource,
  TruthEventType,
  TruthLifecycleState,
  TruthRecord,
  TruthRecordCertification,
  TruthRecordContractInput,
  TruthRecordContractReasonCode,
  TruthRecordContractRequest,
  TruthRecordContractValidation,
  TruthRecordObservabilityMetrics,
  TruthRecordOperatorVisibility,
  TruthRecordReplay,
  TruthReplayResult,
  TruthValidationState,
} from "./types";

const EVENT_TYPES = new Set<TruthEventType>([
  "OBSERVATION_CREATED",
  "OBSERVATION_UPDATED",
  "RECOMMENDATION_CREATED",
  "RECOMMENDATION_APPROVED",
  "RECOMMENDATION_REJECTED",
  "GOVERNANCE_APPROVED",
  "GOVERNANCE_DENIED",
  "GOVERNANCE_ESCALATED",
  "RUNTIME_STARTED",
  "RUNTIME_STOPPED",
  "RUNTIME_RESTRICTED",
  "CERTIFICATION_PASSED",
  "CERTIFICATION_FAILED",
  "REPLAY_COMPLETED",
  "REPLAY_FAILED",
  "ESCALATION_OPENED",
  "ESCALATION_CLOSED",
]);

const EVENT_SOURCES = new Set<TruthEventSource>([
  "OPERATOR",
  "MISSION_ENGINE",
  "RUNTIME_ENGINE",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "REPLAY_ENGINE",
  "SUPERVISION_ENGINE",
]);

const LIFECYCLE_STATES = new Set<TruthLifecycleState>([
  "CREATED",
  "VALIDATED",
  "ACTIVE",
  "SUPERSEDED",
  "ARCHIVED",
  "REVOKED",
]);

const IMMUTABLE_FIELDS = [
  "truth_record_id",
  "tenant_id",
  "mission_id",
  "timestamp",
  "event_type",
  "event_source",
] as const satisfies readonly (keyof TruthRecord)[];

const ALLOWED_TRANSITIONS: Readonly<Record<TruthLifecycleState, readonly TruthLifecycleState[]>> = Object.freeze({
  CREATED: ["VALIDATED"],
  VALIDATED: ["ACTIVE"],
  ACTIVE: ["SUPERSEDED", "REVOKED"],
  SUPERSEDED: ["ARCHIVED"],
  ARCHIVED: ["ARCHIVED"],
  REVOKED: ["REVOKED"],
});

const FUTURE_TOLERANCE_MS = 60_000;

function addReason(
  reasons: TruthRecordContractReasonCode[],
  reason: TruthRecordContractReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthRecordContractRequest): TruthRecordContractRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    now: request.now,
  });
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
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

function validateReferenceCatalog(
  refs: readonly string[],
  tenantId: string,
  catalog: readonly TruthCatalogReference[],
): {
  valid: boolean;
  missingAny: boolean;
  unresolvedAny: boolean;
} {
  const entries = new Map(catalog.map((entry) => [entry.referenceId, entry]));
  let valid = true;
  let missingAny = false;
  let unresolvedAny = false;
  for (const ref of refs) {
    const entry = entries.get(ref);
    if (!entry) {
      valid = false;
      missingAny = true;
      continue;
    }
    const resolvable = entry.resolvable ?? true;
    if (
      entry.tenantId !== tenantId
      || entry.immutable !== true
      || entry.accessible !== true
      || entry.auditable !== true
      || resolvable !== true
    ) {
      valid = false;
      unresolvedAny = true;
    }
  }
  return { valid, missingAny, unresolvedAny };
}

function validateBoundary(
  input: TruthRecordContractInput,
  reasons: TruthRecordContractReasonCode[],
): {
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  invalidBoundary: boolean;
} {
  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.rankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.scoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = createBoundaryFlags({
    executionAuthorized: false,
    workflowRoutingAllowed: false,
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

  return Object.freeze({
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    controlSurfaceAbsent,
    invalidBoundary: !executionImpossible
      || !approvalAbsent
      || !rankingAbsent
      || !prioritizationAbsent
      || !scoringAbsent
      || !resourceAllocationAbsent
      || !authorityBounded
      || !controlSurfaceAbsent,
  });
}

function lifecycleTransitionValid(
  previous: TruthLifecycleState | null | undefined,
  current: TruthLifecycleState,
): boolean {
  if (!previous) return current === "CREATED" || current === "VALIDATED";
  return ALLOWED_TRANSITIONS[previous]?.includes(current) ?? false;
}

function replayResultFromValidity(
  evidenceValid: boolean,
  replayValid: boolean,
  lifecycleValid: boolean,
): TruthReplayResult {
  if (!evidenceValid) return "INCOMPLETE_EVIDENCE";
  if (!replayValid) return "UNREPLAYABLE";
  if (!lifecycleValid) return "MISMATCH";
  return "REPRODUCED";
}

function certificationStateFromSignals(
  valid: boolean,
  completionReady: boolean,
  evidenceValid: boolean,
  replayValid: boolean,
  lifecycleValid: boolean,
): TruthCertificationState {
  if (!valid || !evidenceValid || !replayValid || !lifecycleValid) return "FAIL";
  if (!completionReady) return "CONDITIONAL_PASS";
  return "PASS";
}

export function buildTruthRecordContractRequest(
  request: TruthRecordContractRequest,
): TruthRecordContractRequest {
  return requestCore(request);
}

export function sealTruthRecordContract(
  input: TruthRecordContractInput,
): SealedTruthRecordContract {
  const reasons: TruthRecordContractReasonCode[] = [];
  const { record } = input;

  const truthRecordIdPresent = record.truth_record_id.length > 0;
  addReason(reasons, truthRecordIdPresent ? "TRUTH_RECORD_ID_PRESENT" : "TRUTH_RECORD_ID_MISSING");
  const truthRecordIdUnique = truthRecordIdPresent
    && !(input.existingTruthRecordIds ?? []).includes(record.truth_record_id);
  addReason(reasons, truthRecordIdUnique ? "TRUTH_RECORD_ID_UNIQUE" : "TRUTH_RECORD_ID_DUPLICATE");

  const tenantPresent = record.tenant_id.length > 0;
  addReason(reasons, tenantPresent ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  const tenantKnown = tenantPresent && input.knownTenantIds.includes(record.tenant_id);
  addReason(reasons, tenantKnown ? "TENANT_ID_KNOWN" : "TENANT_ID_UNKNOWN");

  const missionPresent = record.mission_id.length > 0;
  addReason(reasons, missionPresent ? "MISSION_ID_PRESENT" : "MISSION_ID_MISSING");
  const missionKnown = missionPresent && input.knownMissionIds.includes(record.mission_id);
  addReason(reasons, missionKnown ? "MISSION_ID_KNOWN" : "MISSION_ID_UNKNOWN");

  const timestampPresent = record.timestamp.length > 0;
  addReason(reasons, timestampPresent ? "TIMESTAMP_PRESENT" : "TIMESTAMP_MISSING");
  const timestampMs = Date.parse(record.timestamp);
  const nowMs = Date.parse(input.request.now);
  const timestampValid = Number.isFinite(timestampMs);
  addReason(reasons, timestampValid ? "TIMESTAMP_VALID" : "TIMESTAMP_INVALID");
  const timestampWithinTolerance = timestampValid && timestampMs <= nowMs + FUTURE_TOLERANCE_MS;
  addReason(reasons, timestampWithinTolerance ? "TIMESTAMP_WITHIN_TOLERANCE" : "TIMESTAMP_OUT_OF_TOLERANCE");

  const eventTypeValid = EVENT_TYPES.has(record.event_type);
  addReason(reasons, eventTypeValid ? "EVENT_TYPE_VALID" : "EVENT_TYPE_INVALID");
  const eventSourceValid = EVENT_SOURCES.has(record.event_source);
  addReason(reasons, eventSourceValid ? "EVENT_SOURCE_VALID" : "EVENT_SOURCE_INVALID");

  const lifecycleStateValid = LIFECYCLE_STATES.has(record.lifecycle_state);
  addReason(reasons, lifecycleStateValid ? "LIFECYCLE_STATE_VALID" : "LIFECYCLE_STATE_INVALID");
  const lifecycleValid = lifecycleStateValid && lifecycleTransitionValid(input.priorLifecycleState, record.lifecycle_state);
  addReason(reasons, lifecycleValid ? "LIFECYCLE_TRANSITION_VALID" : "LIFECYCLE_TRANSITION_INVALID");

  const evidencePresent = record.evidence_references.length > 0;
  addReason(reasons, evidencePresent ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  const evidenceCheck = validateReferenceCatalog(record.evidence_references, record.tenant_id, input.evidenceCatalog);
  const evidenceValid = evidencePresent && evidenceCheck.valid;
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCES_VALID" : "EVIDENCE_REFERENCES_INVALID");

  const replayPresent = record.replay_references.length > 0;
  addReason(reasons, replayPresent ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  const replayCheck = validateReferenceCatalog(record.replay_references, record.tenant_id, input.replayCatalog);
  const replayValid = replayPresent && replayCheck.valid;
  addReason(reasons, replayValid ? "REPLAY_REFERENCES_VALID" : "REPLAY_REFERENCES_INVALID");

  const tenantIsolationValid = input.accessTenantId === undefined || input.accessTenantId === record.tenant_id;
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const immutabilityPreserved = IMMUTABLE_FIELDS.every((field) => (
    input.immutableBaseline?.[field] === undefined
      || input.immutableBaseline[field] === record[field]
  ));
  addReason(reasons, immutabilityPreserved ? "IMMUTABILITY_PRESERVED" : "IMMUTABILITY_VIOLATED");

  const validationState: TruthValidationState = truthRecordIdPresent
    && truthRecordIdUnique
    && tenantKnown
    && missionKnown
    && timestampPresent
    && timestampValid
    && timestampWithinTolerance
    && eventTypeValid
    && eventSourceValid
    && lifecycleValid
    && evidenceValid
    && replayValid
    && tenantIsolationValid
    && immutabilityPreserved
    ? "VALID"
    : "INVALID";

  const valid = validationState === "VALID";
  const replayResult = replayResultFromValidity(evidenceValid, replayValid, lifecycleValid);
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

  const completionReady = record.lifecycle_state !== "CREATED";
  const certificationState = certificationStateFromSignals(valid, completionReady, evidenceValid, replayValid, lifecycleValid);
  addReason(
    reasons,
    certificationState === "PASS"
      ? "CERTIFICATION_PASS"
      : certificationState === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const boundary = validateBoundary(input, reasons);
  addReason(reasons, "TRUTH_RECORD_CONTRACT_IS_NOT_CONTROL");

  const operatorVisibility: TruthRecordOperatorVisibility = Object.freeze({
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    timestamp: record.timestamp,
    event_type: record.event_type,
    event_source: record.event_source,
    lifecycle_state: record.lifecycle_state,
    evidence_references: [...record.evidence_references],
    replay_references: [...record.replay_references],
    validation_status: validationState,
    readOnly: true,
    auditable: true,
    tenantScoped: tenantIsolationValid,
    replayLinked: replayPresent,
  });
  addReason(reasons, tenantIsolationValid ? "OPERATOR_VISIBILITY_AVAILABLE" : "OPERATOR_VISIBILITY_BLOCKED");

  const observability: TruthRecordObservabilityMetrics = Object.freeze({
    truth_records_created: record.lifecycle_state === "CREATED" ? 1 : 0,
    truth_records_validated: record.lifecycle_state === "VALIDATED" ? 1 : 0,
    truth_records_active: record.lifecycle_state === "ACTIVE" ? 1 : 0,
    truth_records_superseded: record.lifecycle_state === "SUPERSEDED" ? 1 : 0,
    truth_records_archived: record.lifecycle_state === "ARCHIVED" ? 1 : 0,
    truth_records_revoked: record.lifecycle_state === "REVOKED" ? 1 : 0,
    validation_failures: valid ? 0 : 1,
    evidence_failures: evidenceValid ? 0 : 1,
    replay_failures: replayValid ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    immutability_violations: immutabilityPreserved ? 0 : 1,
  });

  const replay: TruthRecordReplay = Object.freeze({
    replayResult,
    reconstructedRecord: Object.freeze({
      ...record,
      evidence_references: [...record.evidence_references],
      replay_references: [...record.replay_references],
    }),
  });

  const certification: TruthRecordCertification = Object.freeze({
    certificationState,
    completionReady,
    lifecycleDeterministic: lifecycleValid,
    evidenceBound: evidenceValid,
    replayBound: replayValid,
    tenantIsolationCertified: tenantIsolationValid,
    operatorVisibilityCertified: tenantIsolationValid,
  });

  const validation: TruthRecordContractValidation = Object.freeze({
    valid: valid && !boundary.invalidBoundary,
    validationState: valid && !boundary.invalidBoundary ? "VALID" : "INVALID",
    reasonCodes: [...reasons],
    tenantIsolationValid,
    immutabilityPreserved,
    evidenceValid,
    replayValid,
    lifecycleValid,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    approvalAbsent: boundary.approvalAbsent,
    rankingAbsent: boundary.rankingAbsent,
    prioritizationAbsent: boundary.prioritizationAbsent,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });

  return Object.freeze({
    request: requestCore(input.request),
    record: Object.freeze({
      ...record,
      evidence_references: [...record.evidence_references],
      replay_references: [...record.replay_references],
    }),
    validation,
    replay,
    operatorVisibility,
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
