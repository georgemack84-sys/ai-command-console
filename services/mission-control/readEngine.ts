import type {
  SealedTruthReadFramework,
  TruthCertificationState,
  TruthReadFrameworkInput,
  TruthReadFrameworkObservability,
  TruthReadFrameworkReasonCode,
  TruthReadFrameworkReplay,
  TruthReadFrameworkRequest,
  TruthReadFrameworkValidation,
  TruthReadFrameworkVisibility,
  TruthReadLedgerEntry,
  TruthReadResult,
  TruthReadType,
  TruthReplayResult,
} from "./types";

const SUPPORTED_READ_TYPES = new Set<TruthReadType>([
  "DIRECT_LOOKUP",
  "LINEAGE_LOOKUP",
  "REPLAY_LOOKUP",
  "CLASSIFICATION_LOOKUP",
  "STATE_LOOKUP",
  "CERTIFICATION_LOOKUP",
  "EVIDENCE_LOOKUP",
]);

function addReason(reasons: TruthReadFrameworkReasonCode[], reason: TruthReadFrameworkReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function requestCore(request: TruthReadFrameworkRequest): TruthReadFrameworkRequest {
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

export function buildTruthReadFrameworkRequest(
  request: TruthReadFrameworkRequest,
): TruthReadFrameworkRequest {
  return requestCore(request);
}

export function sealTruthReadFramework(
  input: TruthReadFrameworkInput,
): SealedTruthReadFramework {
  const reasons: TruthReadFrameworkReasonCode[] = [];
  const readRequest = input.readRequest;

  const readIdPresent = readRequest.read_id.length > 0;
  addReason(reasons, readIdPresent ? "READ_ID_PRESENT" : "READ_ID_MISSING");
  const tenantPresent = readRequest.tenant_id.length > 0;
  addReason(reasons, tenantPresent ? "READ_TENANT_PRESENT" : "READ_TENANT_MISSING");
  const readTypePresent = readRequest.read_type.length > 0;
  addReason(reasons, readTypePresent ? "READ_TYPE_PRESENT" : "READ_TYPE_MISSING");
  const readTypeSupported = SUPPORTED_READ_TYPES.has(readRequest.read_type);
  addReason(reasons, readTypeSupported ? "READ_TYPE_SUPPORTED" : "READ_TYPE_UNSUPPORTED");

  const directLookupFound = input.directLookupFound !== false;
  const directLookupValid = readRequest.read_type !== "DIRECT_LOOKUP" || directLookupFound;
  addReason(reasons, directLookupValid ? "DIRECT_LOOKUP_VALID" : "DIRECT_LOOKUP_NOT_FOUND");

  const lineageLookupValid = readRequest.read_type !== "LINEAGE_LOOKUP"
    || (input.lineageCycleDetected !== true && input.brokenLineageDetected !== true);
  addReason(reasons, lineageLookupValid ? "LINEAGE_LOOKUP_VALID" : "LINEAGE_LOOKUP_INVALID");
  addReason(reasons, input.lineageCycleDetected !== true ? "LINEAGE_CYCLE_ABSENT" : "LINEAGE_CYCLE_DETECTED");
  addReason(reasons, input.brokenLineageDetected !== true ? "LINEAGE_INTACT" : "LINEAGE_BROKEN");

  const replayContextComplete = input.replayArtifactsPresent !== false
    && input.incompleteReplayContextDetected !== true
    && input.evidenceReferencesResolvable !== false
    && input.replayReferencesResolvable !== false;
  addReason(reasons, replayContextComplete ? "REPLAY_CONTEXT_COMPLETE" : "REPLAY_CONTEXT_INCOMPLETE");
  const replayLookupValid = readRequest.read_type !== "REPLAY_LOOKUP" || replayContextComplete;
  addReason(reasons, replayLookupValid ? "REPLAY_LOOKUP_VALID" : "REPLAY_LOOKUP_INVALID");
  addReason(reasons, input.evidenceReferencesResolvable !== false ? "EVIDENCE_REFERENCES_RESOLVABLE" : "EVIDENCE_REFERENCES_MISSING");
  addReason(reasons, input.replayReferencesResolvable !== false ? "REPLAY_REFERENCES_RESOLVABLE" : "REPLAY_REFERENCES_MISSING");

  const tenantIsolationValid = readRequest.tenant_id === input.request.tenant_id
    && readRequest.tenant_id === input.storage.primarySnapshot.tenant_id
    && readRequest.tenant_id === input.write.ledgerEntry.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === readRequest.tenant_id)
    && (input.queryTenantScoped ?? true);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const identityConsistent = input.duplicateIdentityReturned !== true;
  addReason(reasons, identityConsistent ? "IDENTITY_CONSISTENT" : "IDENTITY_MISMATCH");
  const tenantConsistent = tenantIsolationValid;
  addReason(reasons, tenantConsistent ? "TENANT_CONSISTENT" : "TENANT_MISMATCH");
  const schemaValid = input.schemaMismatchDetected !== true
    && readRequest.schema_version === input.storage.schema.schema_version;
  addReason(reasons, schemaValid ? "SCHEMA_VALID" : "SCHEMA_MISMATCH");
  const resultIntegrityValid = input.corruptResultDetected !== true
    && identityConsistent
    && tenantConsistent
    && schemaValid;
  addReason(reasons, resultIntegrityValid ? "RESULT_INTEGRITY_VALID" : "RESULT_CORRUPT");

  const deterministicOrdering = input.nondeterministicOrderingDetected !== true;
  addReason(reasons, deterministicOrdering ? "ORDERING_DETERMINISTIC" : "ORDERING_NONDETERMINISTIC");
  const paginationValid = input.unstablePaginationDetected !== true
    && input.invalidCursorDetected !== true
    && input.unboundedQueryDetected !== true
    && (input.pageSize ?? 50) <= (input.maxPageSize ?? 100);
  addReason(reasons, paginationValid ? "PAGINATION_VALID" : "PAGINATION_INVALID");
  addReason(reasons, input.unboundedQueryDetected !== true && (input.queryTenantScoped ?? true) ? "QUERY_SCOPED" : "QUERY_UNSCOPED");

  const failClosed = input.storageFailureDetected !== true || true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

  const readResult: TruthReadResult = !readTypeSupported || !tenantIsolationValid || !resultIntegrityValid
    ? "REJECTED"
    : !directLookupFound && readRequest.read_type === "DIRECT_LOOKUP"
      ? "NOT_FOUND"
      : "RETURNED";

  const resultCount = readResult === "RETURNED"
    ? readRequest.read_type === "LINEAGE_LOOKUP"
      ? (input.lineageNodes?.length ?? input.ancestorTruthIds?.length ?? 1)
      : 1
    : 0;

  const failureReason = readResult === "RETURNED"
    ? null
    : [
      !directLookupFound && readRequest.read_type === "DIRECT_LOOKUP" && "record not found",
      !tenantIsolationValid && "cross-tenant read blocked",
      !schemaValid && "schema mismatch",
      !resultIntegrityValid && "corrupt result",
      !lineageLookupValid && "lineage failure",
      !replayLookupValid && "replay failure",
      !paginationValid && "invalid pagination",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthReadLedgerEntry = Object.freeze({
    read_id: readRequest.read_id,
    tenant_id: readRequest.tenant_id,
    mission_id: readRequest.mission_id,
    truth_record_id: readRequest.truth_record_id,
    read_type: readRequest.read_type,
    read_source: readRequest.read_source,
    read_timestamp: readRequest.read_timestamp,
    read_result: readResult,
    failure_reason: failureReason,
    result_count: resultCount,
  });

  const replayResult: TruthReplayResult = !replayContextComplete
    ? "INCOMPLETE_EVIDENCE"
    : input.storageFailureDetected === true
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true || !deterministicOrdering
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "READ_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "READ_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "READ_REPLAY_INCOMPLETE_EVIDENCE"
          : "READ_REPLAY_UNREPLAYABLE",
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
  addReason(reasons, "READ_ENGINE_IS_NOT_CONTROL");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const pass = readIdPresent
    && tenantPresent
    && readTypePresent
    && readTypeSupported
    && directLookupValid
    && lineageLookupValid
    && replayLookupValid
    && tenantIsolationValid
    && resultIntegrityValid
    && deterministicOrdering
    && paginationValid
    && replayContextComplete
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
    && readResult === "RETURNED"
    && input.observabilityGapDetected === true
    && input.analyticsLimitationDetected === true
    && input.remediationDocumented === true
    && tenantIsolationValid
    && resultIntegrityValid
    && deterministicOrdering
    && paginationValid
    && replayContextComplete
    && replayResult === "REPRODUCED"
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

  const visibility: TruthReadFrameworkVisibility = Object.freeze({
    read_id: ledgerEntry.read_id,
    read_type: ledgerEntry.read_type,
    read_result: ledgerEntry.read_result,
    read_timestamp: ledgerEntry.read_timestamp,
    tenant_id: ledgerEntry.tenant_id,
    mission_id: ledgerEntry.mission_id,
    truth_record_id: ledgerEntry.truth_record_id,
    result_count: ledgerEntry.result_count,
    failure_reason: ledgerEntry.failure_reason,
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthReadFrameworkObservability = Object.freeze({
    reads_total: 1,
    direct_lookups_total: readRequest.read_type === "DIRECT_LOOKUP" ? 1 : 0,
    lineage_lookups_total: readRequest.read_type === "LINEAGE_LOOKUP" ? 1 : 0,
    replay_lookups_total: readRequest.read_type === "REPLAY_LOOKUP" ? 1 : 0,
    reads_failed: readResult === "REJECTED" ? 1 : 0,
    read_not_found_total: readResult === "NOT_FOUND" ? 1 : 0,
    read_tenant_scope_failures: tenantIsolationValid ? 0 : 1,
    read_lineage_failures: lineageLookupValid ? 0 : 1,
    read_replay_failures: replayLookupValid ? 0 : 1,
    read_ordering_failures: deterministicOrdering ? 0 : 1,
    average_read_latency: 1,
  });

  const validation: TruthReadFrameworkValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    directLookupValid,
    lineageLookupValid,
    replayLookupValid,
    tenantIsolationValid,
    resultIntegrityValid,
    deterministicOrdering,
    paginationValid,
    replayContextComplete,
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

  const replay: TruthReadFrameworkReplay = Object.freeze({
    replayResult,
    reconstructedLedgerEntry: ledgerEntry,
  });

  return Object.freeze({
    request: requestCore(input.request),
    readRequest,
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
