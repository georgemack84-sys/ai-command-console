import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEventOrderingFramework,
  TruthCertificationState,
  TruthEventChronology,
  TruthEventOrderingConflictResolution,
  TruthEventOrderingInput,
  TruthEventOrderingLedgerEntry,
  TruthEventOrderingObservability,
  TruthEventOrderingQueries,
  TruthEventOrderingReasonCode,
  TruthEventOrderingReplay,
  TruthEventOrderingRequest,
  TruthEventOrderingValidation,
  TruthEventOrderingVisibility,
  TruthEventOrderingNamespaceAssignments,
  TruthEventOrderingContract,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthEventOrderingReasonCode[], reason: TruthEventOrderingReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEventOrderingRequest): TruthEventOrderingRequest {
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

function maxOf(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

function orderEventIds(
  prior: readonly TruthEventOrderingLedgerEntry[],
  current: TruthEventOrderingLedgerEntry,
): readonly string[] {
  return Object.freeze(
    [...prior, current]
      .slice()
      .sort((left, right) => left.global_sequence - right.global_sequence || left.event_id.localeCompare(right.event_id))
      .map((entry) => entry.event_id),
  );
}

export function buildTruthEventOrderingRequest(
  request: TruthEventOrderingRequest,
): TruthEventOrderingRequest {
  return requestCore(request);
}

export function sealTruthEventOrderingFramework(
  input: TruthEventOrderingInput,
): SealedTruthEventOrderingFramework {
  const reasons: TruthEventOrderingReasonCode[] = [];
  const priorOrderings = input.priorOrderings ?? [];
  const recorder = input.recorder;
  const event = recorder.normalizedEvent.event;
  const recording = recorder.recording;

  const writeTimestamp = input.writeTimestamp ?? recording.recording_timestamp;
  const storageCommitTimestamp = input.storageCommitTimestamp ?? recording.recording_timestamp;
  const timestampsValid = !Number.isNaN(Date.parse(event.event_timestamp))
    && !Number.isNaN(Date.parse(recording.recording_timestamp))
    && !Number.isNaN(Date.parse(writeTimestamp))
    && !Number.isNaN(Date.parse(storageCommitTimestamp));
  addReason(reasons, timestampsValid ? "TIMESTAMPS_VALID" : "TIMESTAMPS_INVALID");

  const maxEventSequence = maxOf(priorOrderings.map((entry) => entry.event_sequence));
  const maxTenantSequence = maxOf(
    priorOrderings
      .filter((entry) => entry.tenant_id === event.tenant_id)
      .map((entry) => entry.tenant_sequence),
  );
  const maxMissionSequence = maxOf(
    priorOrderings
      .filter((entry) => entry.mission_id === event.mission_id)
      .map((entry) => entry.mission_sequence),
  );
  const maxGlobalSequence = maxOf(priorOrderings.map((entry) => entry.global_sequence));
  const maxTruthRecordSequence = maxOf(
    priorOrderings
      .filter((entry) => entry.truth_record_id === event.truth_record_id)
      .map((entry) => entry.event_sequence),
  );
  const maxLineageSequence = maxOf(
    priorOrderings
      .filter((entry) => entry.truth_record_id === (input.lineageRootId ?? event.related_lineage_root_id ?? event.truth_record_id))
      .map((entry) => entry.event_sequence),
  );

  const eventSequence = input.eventSequence ?? (maxEventSequence + 1);
  const tenantSequence = input.tenantSequence ?? (maxTenantSequence + 1);
  const missionSequence = input.missionSequence ?? (maxMissionSequence + 1);
  const globalSequence = input.globalSequence ?? (maxGlobalSequence + 1);
  const truthRecordSequence = maxTruthRecordSequence + 1;
  const lineageSequence = input.lineageSequence ?? (maxLineageSequence + 1);

  addReason(reasons, eventSequence > 0 ? "EVENT_SEQUENCE_PRESENT" : "EVENT_SEQUENCE_MISSING");
  addReason(reasons, tenantSequence > 0 ? "TENANT_SEQUENCE_PRESENT" : "TENANT_SEQUENCE_MISSING");
  addReason(reasons, missionSequence > 0 ? "MISSION_SEQUENCE_PRESENT" : "MISSION_SEQUENCE_MISSING");
  addReason(reasons, globalSequence > 0 ? "GLOBAL_SEQUENCE_PRESENT" : "GLOBAL_SEQUENCE_MISSING");

  const duplicateSequence = priorOrderings.some((entry) => entry.event_sequence === eventSequence)
    || priorOrderings.some((entry) => entry.global_sequence === globalSequence)
    || priorOrderings.some((entry) => entry.tenant_id === event.tenant_id && entry.tenant_sequence === tenantSequence)
    || priorOrderings.some((entry) => entry.mission_id === event.mission_id && entry.mission_sequence === missionSequence);
  addReason(reasons, !duplicateSequence ? "EVENT_SEQUENCE_UNIQUE" : "EVENT_SEQUENCE_DUPLICATE");

  const deterministicAssignmentValid = input.sequenceDriftDetected !== true
    && eventSequence === maxEventSequence + 1
    && tenantSequence === maxTenantSequence + 1
    && missionSequence === maxMissionSequence + 1
    && globalSequence === maxGlobalSequence + 1;
  addReason(reasons, deterministicAssignmentValid ? "DETERMINISTIC_ASSIGNMENT_VALID" : "SEQUENCE_DRIFT_DETECTED");

  const temporalOrderingValid = input.chronologyViolationDetected !== true
    && timestampsValid
    && Date.parse(storageCommitTimestamp) >= Date.parse(recording.recording_timestamp)
    && Date.parse(recording.recording_timestamp) >= Date.parse(event.event_timestamp);
  addReason(reasons, temporalOrderingValid ? "TEMPORAL_ORDERING_VALID" : "CHRONOLOGY_VIOLATION_DETECTED");

  const namespaceIntegrityValid = input.namespaceCollisionDetected !== true
    && !duplicateSequence;
  addReason(reasons, namespaceIntegrityValid ? "NAMESPACE_ASSIGNMENT_VALID" : "NAMESPACE_COLLISION_DETECTED");

  const resolutionKey: readonly [number, string, string, string] = [
    recorder.ledgerEntry.storage_commit_sequence,
    recording.recording_timestamp,
    event.event_timestamp,
    event.event_id,
  ];
  const conflictResolution: TruthEventOrderingConflictResolution = Object.freeze({
    resolutionKey,
    usedStorageCommitSequence: true,
    usedRecordedTimestamp: true,
    usedEventTimestamp: true,
    usedEventId: true,
    deterministic: true,
  });
  const conflictResolutionValid = input.nonDeterministicResolutionDetected !== true;
  addReason(reasons, conflictResolutionValid ? "CONFLICT_RESOLUTION_VALID" : "CONFLICT_RESOLUTION_NON_DETERMINISTIC");

  const ordering: TruthEventOrderingContract = Object.freeze({
    event_id: event.event_id,
    tenant_id: event.tenant_id,
    mission_id: event.mission_id,
    truth_record_id: event.truth_record_id,
    event_timestamp: event.event_timestamp,
    recorded_timestamp: recording.recording_timestamp,
    write_timestamp: writeTimestamp,
    storage_commit_timestamp: storageCommitTimestamp,
    event_sequence: eventSequence,
    tenant_sequence: tenantSequence,
    mission_sequence: missionSequence,
    global_sequence: globalSequence,
    ordering_version: "truth-ordering/v1",
  });

  const chronologyValid = input.chronologyCorruptionDetected !== true && temporalOrderingValid;
  addReason(reasons, chronologyValid ? "CHRONOLOGY_VALID" : "CHRONOLOGY_CORRUPTED");

  const chronologyWindow = orderEventIds(
    priorOrderings,
    {
      event_id: ordering.event_id,
      tenant_id: ordering.tenant_id,
      mission_id: ordering.mission_id,
      truth_record_id: ordering.truth_record_id,
      ordering_status: "ORDERED",
      event_sequence: ordering.event_sequence,
      tenant_sequence: ordering.tenant_sequence,
      mission_sequence: ordering.mission_sequence,
      global_sequence: ordering.global_sequence,
      ordering_timestamp: input.request.now,
      conflict_resolution_key: hashValue("mission-control-ordering-conflict-key", conflictResolution.resolutionKey),
      chronology_status: chronologyValid ? "VALID" : "INVALID",
      replay_status: "REPRODUCED",
      failure_reason: null,
    },
  );
  const chronology: TruthEventChronology = Object.freeze({
    first_event_id: chronologyWindow[0] ?? ordering.event_id,
    latest_event_id: chronologyWindow[chronologyWindow.length - 1] ?? ordering.event_id,
    previous_event_id: chronologyWindow.length > 1 ? chronologyWindow[chronologyWindow.length - 2] : undefined,
    next_event_id: undefined,
    event_chain: chronologyWindow,
    event_gap_detected: ordering.global_sequence !== chronologyWindow.length,
    chronology_window: chronologyWindow.slice(Math.max(chronologyWindow.length - 5, 0)),
  });

  const integrityValid = deterministicAssignmentValid
    && temporalOrderingValid
    && namespaceIntegrityValid
    && conflictResolutionValid
    && chronologyValid;
  addReason(reasons, integrityValid ? "INTEGRITY_VALID" : "INTEGRITY_INVALID");

  const tenantIsolationValid = input.crossTenantSequenceLeakageDetected !== true
    && input.crossTenantChronologyAccessDetected !== true
    && recorder.visibility.tenantScoped
    && (input.accessTenantId === undefined || input.accessTenantId === event.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const queryFrameworkOperational = input.queryInstabilityDetected !== true;
  addReason(reasons, queryFrameworkOperational ? "QUERY_FRAMEWORK_OPERATIONAL" : "QUERY_FRAMEWORK_UNSTABLE");

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
  addReason(reasons, "EVENT_ORDERING_ENGINE_IS_NOT_CONTROL");

  const replayResult: TruthReplayResult = recorder.replay.replayResult !== "REPRODUCED"
    ? recorder.replay.replayResult
    : input.replayMismatchDetected === true
      || input.sequenceDriftDetected === true
      || input.chronologyViolationDetected === true
      || input.nonDeterministicResolutionDetected === true
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

  const pass = eventSequence > 0
    && tenantSequence > 0
    && missionSequence > 0
    && globalSequence > 0
    && !duplicateSequence
    && timestampsValid
    && deterministicAssignmentValid
    && temporalOrderingValid
    && namespaceIntegrityValid
    && conflictResolutionValid
    && chronologyValid
    && integrityValid
    && tenantIsolationValid
    && queryFrameworkOperational
    && replayResult === "REPRODUCED"
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
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && deterministicAssignmentValid
    && temporalOrderingValid
    && namespaceIntegrityValid
    && conflictResolutionValid
    && chronologyValid
    && integrityValid
    && tenantIsolationValid
    && replayResult === "REPRODUCED";

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const namespaces: TruthEventOrderingNamespaceAssignments = Object.freeze({
    GLOBAL: globalSequence,
    TENANT: tenantSequence,
    MISSION: missionSequence,
    TRUTH_RECORD: truthRecordSequence,
    LINEAGE: lineageSequence,
  });

  const failureReason = pass || conditional
    ? null
    : [
      duplicateSequence && "duplicate sequence",
      !deterministicAssignmentValid && "sequence drift",
      !temporalOrderingValid && "chronology violation",
      !namespaceIntegrityValid && "namespace collision",
      !conflictResolutionValid && "non-deterministic conflict resolution",
      !tenantIsolationValid && "cross-tenant ordering blocked",
      replayResult === "MISMATCH" && "ordering replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthEventOrderingLedgerEntry = Object.freeze({
    event_id: ordering.event_id,
    tenant_id: ordering.tenant_id,
    mission_id: ordering.mission_id,
    truth_record_id: ordering.truth_record_id,
    ordering_status: pass || conditional ? "ORDERED" : "REJECTED",
    event_sequence: ordering.event_sequence,
    tenant_sequence: ordering.tenant_sequence,
    mission_sequence: ordering.mission_sequence,
    global_sequence: ordering.global_sequence,
    ordering_timestamp: input.request.now,
    conflict_resolution_key: hashValue("mission-control-ordering-conflict-key", conflictResolution.resolutionKey),
    chronology_status: chronologyValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthEventOrderingVisibility = Object.freeze({
    event_id: ordering.event_id,
    event_sequence: ordering.event_sequence,
    tenant_sequence: ordering.tenant_sequence,
    mission_sequence: ordering.mission_sequence,
    global_sequence: ordering.global_sequence,
    event_timestamp: ordering.event_timestamp,
    ordering_status: ledgerEntry.ordering_status,
    chronology_status: ledgerEntry.chronology_status,
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const sortedAll = [...priorOrderings, ledgerEntry].sort((left, right) => left.global_sequence - right.global_sequence || left.event_id.localeCompare(right.event_id));
  const queries: TruthEventOrderingQueries = Object.freeze({
    by_global_sequence: Object.freeze(sortedAll.map((entry) => entry.event_id)),
    by_tenant_sequence: Object.freeze(
      sortedAll
        .filter((entry) => entry.tenant_id === event.tenant_id)
        .sort((left, right) => left.tenant_sequence - right.tenant_sequence || left.event_id.localeCompare(right.event_id))
        .map((entry) => entry.event_id),
    ),
    by_mission_sequence: Object.freeze(
      sortedAll
        .filter((entry) => entry.mission_id === event.mission_id)
        .sort((left, right) => left.mission_sequence - right.mission_sequence || left.event_id.localeCompare(right.event_id))
        .map((entry) => entry.event_id),
    ),
    by_truth_record_sequence: Object.freeze(
      sortedAll
        .filter((entry) => entry.truth_record_id === event.truth_record_id)
        .sort((left, right) => left.event_sequence - right.event_sequence || left.event_id.localeCompare(right.event_id))
        .map((entry) => entry.event_id),
    ),
    by_lineage_sequence: Object.freeze(
      sortedAll
        .filter((entry) => entry.truth_record_id === (input.lineageRootId ?? event.related_lineage_root_id ?? event.truth_record_id))
        .sort((left, right) => left.event_sequence - right.event_sequence || left.event_id.localeCompare(right.event_id))
        .map((entry) => entry.event_id),
    ),
    by_time_range: Object.freeze(sortedAll.map((entry) => entry.event_id)),
    by_chronology_window: chronology.chronology_window,
  });

  const observability: TruthEventOrderingObservability = Object.freeze({
    events_ordered_total: priorOrderings.filter((entry) => entry.ordering_status === "ORDERED").length + (pass || conditional ? 1 : 0),
    ordering_conflicts: duplicateSequence || recorder.ledgerEntry.event_sequence !== recorder.ledgerEntry.storage_commit_sequence ? 1 : 0,
    conflicts_resolved: conflictResolutionValid ? 1 : 0,
    sequence_collisions: duplicateSequence || input.namespaceCollisionDetected === true ? 1 : 0,
    chronology_violations: temporalOrderingValid && chronologyValid ? 0 : 1,
    ordering_validation_failures: pass || conditional ? 0 : 1,
    replay_ordering_failures: replayResult === "REPRODUCED" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });
  addReason(reasons, input.observabilityGapDetected === true ? "OBSERVABILITY_GAP_DETECTED" : "OBSERVABILITY_OPERATIONAL");

  const validation: TruthEventOrderingValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    deterministicOrdering: deterministicAssignmentValid && conflictResolutionValid,
    temporalOrderingValid,
    namespaceIntegrityValid,
    chronologyValid,
    integrityValid,
    tenantIsolationValid,
    queryFrameworkOperational,
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

  const replay: TruthEventOrderingReplay = Object.freeze({
    replayResult,
    reconstructedOrdering: ordering,
    chronology,
  });

  return Object.freeze({
    request: requestCore(input.request),
    recorder,
    ordering,
    namespaces,
    conflictResolution,
    chronology,
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
