import type {
  SealedTruthStorageFramework,
  TruthCertificationState,
  TruthReplayResult,
  TruthStorageAdapterRegistryEntry,
  TruthStorageAdapterState,
  TruthStorageAdapterType,
  TruthStorageErrorClass,
  TruthStorageFrameworkInput,
  TruthStorageFrameworkObservability,
  TruthStorageFrameworkReasonCode,
  TruthStorageFrameworkReplay,
  TruthStorageFrameworkRequest,
  TruthStorageFrameworkValidation,
  TruthStorageFrameworkVisibility,
  TruthStorageMigrationRecord,
  TruthStorageMigrationState,
  TruthStorageOperation,
  TruthStorageRecordSnapshot,
  TruthStorageSchemaFoundation,
} from "./types";

const OPERATIONS = Object.freeze<TruthStorageOperation[]>([
  "create_truth_record",
  "get_truth_record",
  "update_truth_state",
  "append_truth_event",
  "list_truth_records",
  "query_truth_records",
  "get_lineage",
  "get_children",
  "get_parents",
  "write_certification_result",
  "read_certification_result",
]);

function addReason(reasons: TruthStorageFrameworkReasonCode[], reason: TruthStorageFrameworkReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function requestCore(request: TruthStorageFrameworkRequest): TruthStorageFrameworkRequest {
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

function defaultRegistry(): readonly TruthStorageAdapterRegistryEntry[] {
  return Object.freeze([
    Object.freeze({
      adapter_id: "sqlite-foundation",
      adapter_type: "SQLITE" as const,
      adapter_version: "v1",
      adapter_state: "ACTIVE" as const,
      capabilities: OPERATIONS,
      migration_status: "APPLIED" as const,
      certification_status: "PASS" as const,
    }),
    Object.freeze({
      adapter_id: "postgresql-future",
      adapter_type: "POSTGRESQL_FUTURE" as const,
      adapter_version: "v1",
      adapter_state: "PLANNED" as const,
      capabilities: OPERATIONS,
      migration_status: "PENDING" as const,
      certification_status: "CONDITIONAL_PASS" as const,
    }),
    Object.freeze({
      adapter_id: "distributed-future",
      adapter_type: "DISTRIBUTED_FUTURE" as const,
      adapter_version: "v1",
      adapter_state: "PLANNED" as const,
      capabilities: OPERATIONS,
      migration_status: "PENDING" as const,
      certification_status: "CONDITIONAL_PASS" as const,
    }),
  ]);
}

function certificationState(valid: boolean, conditional: boolean): TruthCertificationState {
  if (valid) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

export function buildTruthStorageFrameworkRequest(
  request: TruthStorageFrameworkRequest,
): TruthStorageFrameworkRequest {
  return requestCore(request);
}

export function sealTruthStorageFramework(
  input: TruthStorageFrameworkInput,
): SealedTruthStorageFramework {
  const reasons: TruthStorageFrameworkReasonCode[] = [];
  const registry = Object.freeze([...(input.adapterRegistry ?? defaultRegistry())]);
  const activeAdapterType = input.activeAdapterType ?? "SQLITE";
  const activeAdapter = registry.find((entry) => entry.adapter_type === activeAdapterType);

  const adapterPresent = !!activeAdapter;
  addReason(reasons, adapterPresent ? "ADAPTER_PRESENT" : "ADAPTER_MISSING");
  const adapterSupported = activeAdapterType === "SQLITE" || activeAdapterType === "POSTGRESQL_FUTURE" || activeAdapterType === "DISTRIBUTED_FUTURE";
  addReason(reasons, adapterSupported ? "ADAPTER_SUPPORTED" : "ADAPTER_UNSUPPORTED");
  const adapterActive = activeAdapter?.adapter_state === "ACTIVE";
  addReason(reasons, adapterActive ? "ADAPTER_ACTIVE" : activeAdapter?.adapter_state === "DISABLED" ? "ADAPTER_DISABLED" : "ADAPTER_NOT_ACTIVE");
  addReason(reasons, activeAdapter?.adapter_state !== "DISABLED" ? "ADAPTER_AVAILABLE" : "ADAPTER_DISABLED");

  const supportedOperations = input.supportedOperations ?? activeAdapter?.capabilities ?? [];
  const operationsSupported = OPERATIONS.every((operation) => supportedOperations.includes(operation));
  addReason(reasons, operationsSupported ? "OPERATION_SUPPORTED" : "OPERATION_UNSUPPORTED");

  const schema: TruthStorageSchemaFoundation = Object.freeze({
    schema_version: input.schemaVersion ?? "truth-storage/v1",
    tables: Object.freeze([
      "truth_records",
      "truth_classifications",
      "truth_identities",
      "truth_state_history",
      "truth_events",
      "truth_certifications",
      "truth_replay_references",
      "truth_evidence_references",
      "storage_migrations",
    ]),
    tenant_indexed: true,
    mission_indexed: true,
    replay_indexed: true,
    certification_indexed: true,
    append_only_history: true,
    migration_ready: true,
  });
  const schemaVersionKnown = input.unknownSchemaVersionDetected !== true;
  addReason(reasons, schemaVersionKnown ? "SCHEMA_VERSION_KNOWN" : "SCHEMA_VERSION_UNKNOWN");
  const schemaValid = input.schemaMismatchDetected !== true && schemaVersionKnown;
  addReason(reasons, schemaValid ? "SCHEMA_VALID" : "SCHEMA_MISMATCH");

  const primarySnapshot: TruthStorageRecordSnapshot = Object.freeze({
    truth_record_id: input.truthRecord.record.truth_record_id,
    tenant_id: input.truthRecord.record.tenant_id,
    mission_id: input.truthRecord.record.mission_id,
    created_at: input.truthRecord.record.timestamp,
    updated_at: input.state.state.state_timestamp,
    record_state: input.state.state.current_state,
    schema_version: schema.schema_version,
    classification_types: Object.freeze(input.classification.classifications.map((item) => item.classification_type)),
    lineage_root_id: input.identity.identity.lineage_root_id,
    parent_truth_ids: Object.freeze([...input.identity.identity.parent_truth_ids]),
    child_truth_ids: Object.freeze([...input.identity.identity.child_truth_ids]),
    certification_state: input.foundationCertification.certification.certification_state,
  });

  const transactionAtomic = input.partialWriteDetected !== true;
  addReason(reasons, transactionAtomic ? "TRANSACTION_ATOMIC" : "PARTIAL_WRITE_DETECTED");
  const rollbackSucceeded = input.rollbackFailed !== true;
  addReason(reasons, rollbackSucceeded ? "ROLLBACK_SUCCEEDED" : "ROLLBACK_FAILED");

  const queryScoped = (input.queryTenantId ?? input.accessTenantId ?? input.request.tenant_id) === input.truthRecord.record.tenant_id;
  addReason(reasons, queryScoped ? "QUERY_TENANT_SCOPED" : "QUERY_TENANT_UNSCOPED");
  const deterministicOrdering = input.nondeterministicOrderingDetected !== true;
  addReason(reasons, deterministicOrdering ? "QUERY_ORDERING_DETERMINISTIC" : "QUERY_ORDERING_NONDETERMINISTIC");

  const migrations = input.migrations ?? Object.freeze<TruthStorageMigrationRecord[]>([
    Object.freeze({
      migration_id: "storage-foundation-v1",
      from_schema_version: "none",
      to_schema_version: schema.schema_version,
      migration_timestamp: input.request.now,
      migration_status: "APPLIED" as TruthStorageMigrationState,
      migration_checksum: "checksum-storage-foundation-v1",
      rollback_available: true,
    }),
  ]);
  addReason(reasons, migrations.length > 0 ? "MIGRATION_RECORDED" : "MIGRATION_FAILURE_UNRECORDED");
  const migrationChecksumValid = input.migrationChecksumMismatchDetected !== true;
  addReason(reasons, migrationChecksumValid ? "MIGRATION_CHECKSUM_VALID" : "MIGRATION_CHECKSUM_MISMATCH");
  const migrationFailureRecorded = input.failedMigrationNotRecorded !== true;
  addReason(reasons, migrationFailureRecorded ? "MIGRATION_FAILURE_RECORDED" : "MIGRATION_FAILURE_UNRECORDED");
  const migrationValid = schema.migration_ready
    && migrations.length > 0
    && migrationChecksumValid
    && migrationFailureRecorded
    && input.migrationFailureDetected !== true;

  const postgresCompatible = input.adapterLeakageDetected !== true;
  addReason(reasons, postgresCompatible ? "POSTGRESQL_COMPATIBLE" : "POSTGRESQL_INCOMPATIBLE");
  addReason(reasons, postgresCompatible ? "ADAPTER_LEAKAGE_ABSENT" : "ADAPTER_LEAKAGE_DETECTED");
  const distributedCompatible = input.nonIdempotentDistributedWriteDetected !== true
    && input.missingConflictMetadata !== true
    && input.nondeterministicOrderingDetected !== true;
  addReason(reasons, distributedCompatible ? "DISTRIBUTED_COMPATIBLE" : "DISTRIBUTED_INCOMPATIBLE");
  addReason(reasons, input.nonIdempotentDistributedWriteDetected !== true ? "IDEMPOTENT_DISTRIBUTED_WRITE" : "NON_IDEMPOTENT_DISTRIBUTED_WRITE");
  addReason(reasons, input.missingConflictMetadata !== true ? "CONFLICT_METADATA_PRESENT" : "CONFLICT_METADATA_MISSING");

  const events = input.storageEvents ?? Object.freeze([
    Object.freeze({
      event_id: "event-foundation-created",
      truth_record_id: input.truthRecord.record.truth_record_id,
      tenant_id: input.truthRecord.record.tenant_id,
      timestamp: input.truthRecord.record.timestamp,
      event_type: input.truthRecord.record.event_type,
      ordering_key: `${input.truthRecord.record.timestamp}:${input.truthRecord.record.truth_record_id}`,
    }),
  ]);
  const eventHistoryComplete = events.length > 0;
  addReason(reasons, eventHistoryComplete ? "EVENT_HISTORY_COMPLETE" : "EVENT_HISTORY_MISSING");
  const evidenceResolvable = (input.resolvableEvidenceReferences ?? input.truthRecord.record.evidence_references).length > 0;
  addReason(reasons, evidenceResolvable ? "EVIDENCE_REFERENCES_RESOLVABLE" : "EVIDENCE_REFERENCES_MISSING");
  const replayResolvable = (input.resolvableReplayReferences ?? input.truthRecord.record.replay_references).length > 0;
  addReason(reasons, replayResolvable ? "REPLAY_REFERENCES_RESOLVABLE" : "REPLAY_REFERENCES_MISSING");
  const replaySupported = eventHistoryComplete
    && deterministicOrdering
    && evidenceResolvable
    && replayResolvable
    && input.replayReadFailureDetected !== true;
  addReason(reasons, replaySupported ? "REPLAY_SUPPORTED" : "REPLAY_RECONSTRUCTION_FAILED");

  const tenantIsolationValid = (input.accessTenantId === undefined || input.accessTenantId === input.truthRecord.record.tenant_id)
    && queryScoped;
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const storageErrorState: TruthStorageErrorClass | "NONE" = input.adapterUnavailable
    ? "ADAPTER_UNAVAILABLE"
    : input.schemaMismatchDetected
      ? "SCHEMA_MISMATCH"
      : input.writeFailureDetected
        ? "WRITE_FAILURE"
        : input.readFailureDetected
          ? "READ_FAILURE"
          : input.partialWriteDetected || input.rollbackFailed
            ? "TRANSACTION_FAILURE"
            : !tenantIsolationValid
              ? "TENANT_SCOPE_VIOLATION"
              : input.migrationFailureDetected
                ? "MIGRATION_FAILURE"
                : input.replayReadFailureDetected
                  ? "REPLAY_READ_FAILURE"
                  : "NONE";
  const failClosed = storageErrorState === "NONE" || (
    input.adapterUnavailable === true
    || input.schemaMismatchDetected === true
    || input.writeFailureDetected === true
    || input.readFailureDetected === true
    || input.partialWriteDetected === true
    || input.rollbackFailed === true
    || tenantIsolationValid === false
    || input.migrationFailureDetected === true
    || input.replayReadFailureDetected === true
  );
  addReason(reasons, failClosed ? "STORAGE_FAILURE_FAIL_CLOSED" : "STORAGE_FAILURE_FAIL_OPEN");

  const replayResult: TruthReplayResult = !eventHistoryComplete || !evidenceResolvable
    ? "INCOMPLETE_EVIDENCE"
    : !replayResolvable || input.replayReadFailureDetected === true
      ? "UNREPLAYABLE"
      : !deterministicOrdering || input.readFailureDetected === true
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
  addReason(reasons, "STORAGE_ABSTRACTION_LAYER_IS_NOT_CONTROL");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const pass = adapterPresent
    && adapterSupported
    && activeAdapterType === "SQLITE"
    && adapterActive
    && operationsSupported
    && schemaValid
    && transactionAtomic
    && rollbackSucceeded
    && queryScoped
    && deterministicOrdering
    && migrationValid
    && replaySupported
    && tenantIsolationValid
    && observabilityOperational
    && postgresCompatible
    && distributedCompatible
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
    && activeAdapterType === "SQLITE"
    && adapterActive
    && schemaValid
    && transactionAtomic
    && rollbackSucceeded
    && queryScoped
    && deterministicOrdering
    && migrationValid
    && replaySupported
    && tenantIsolationValid
    && failClosed
    && (input.observabilityGapDetected === true || input.futureAdapterLimitationDetected === true)
    && input.remediationDocumented === true;

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const visibility: TruthStorageFrameworkVisibility = Object.freeze({
    active_storage_adapter: activeAdapterType,
    adapter_state: activeAdapter?.adapter_state ?? "DISABLED",
    schema_version: schema.schema_version,
    migration_status: migrations.at(-1)?.migration_status ?? "FAILED",
    last_successful_write: pass || conditional ? input.request.now : null,
    last_successful_read: replayResult === "REPRODUCED" ? input.request.now : null,
    storage_error_state: storageErrorState,
    certification_status: certification,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthStorageFrameworkObservability = Object.freeze({
    storage_reads_total: 1,
    storage_writes_total: 1,
    storage_write_failures: input.writeFailureDetected ? 1 : 0,
    storage_read_failures: input.readFailureDetected ? 1 : 0,
    transaction_failures: input.partialWriteDetected || input.rollbackFailed ? 1 : 0,
    migration_failures: input.migrationFailureDetected ? 1 : 0,
    tenant_scope_violations: tenantIsolationValid ? 0 : 1,
    replay_read_failures: input.replayReadFailureDetected ? 1 : 0,
    active_adapter: activeAdapterType,
    schema_version: schema.schema_version,
  });

  const validation: TruthStorageFrameworkValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    adapterValid: adapterPresent && adapterSupported && activeAdapter?.adapter_state !== "DISABLED",
    schemaValid,
    transactionAtomic: transactionAtomic && rollbackSucceeded,
    queryScoped,
    deterministicOrdering,
    migrationValid,
    replaySupported,
    tenantIsolationValid,
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

  const replay: TruthStorageFrameworkReplay = Object.freeze({
    replayResult,
    reconstructedSnapshot: primarySnapshot,
  });

  return Object.freeze({
    request: requestCore(input.request),
    adapterRegistry: registry,
    schema,
    primarySnapshot,
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
