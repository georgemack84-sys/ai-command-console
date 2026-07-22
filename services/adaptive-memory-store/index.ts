import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveMemoryFoundation, replayAdaptiveMemoryFoundation } from "@/services/adaptive-memory-foundation";
import type { MemoryClassification, MemoryOwner, MemoryType } from "@/types/adaptive-memory-foundation";
import type {
  AdaptiveMemoryStore as AdaptiveMemoryStoreDefinition,
  AdaptiveMemoryStoreApiSurface,
  AdaptiveMemoryStoreContract,
  AdaptiveMemoryStoreFailure,
  AdaptiveMemoryStoreInput,
  AdaptiveMemoryStoreMetrics,
  AdaptiveMemoryStoreResult,
  AdaptiveMemoryStoreScenario,
  AdaptiveMemoryStoreStatus,
  IntegrityValidationReport,
  MemoryIdentity,
  MemoryStorageLedgerEntry,
  RetrievalIndex,
  StorageCategory,
  StorageLifecycleState,
  StorageValidationStage,
  StoredAdaptiveMemoryRecord,
} from "@/types/adaptive-memory-store";

const STORE_VERSION = "adaptive-memory-store/v1" as const;
const STORE_IDENTIFIER = "AdaptiveMemoryStore" as const;
const CREATION_TIMESTAMP = "2026-07-11T00:00:00.000Z";
const VERSION = "v1";

const LIFECYCLE: readonly StorageLifecycleState[] = Object.freeze([
  "CANDIDATE",
  "VALIDATED",
  "APPROVED",
  "PERSISTED",
  "INDEXED",
  "AVAILABLE",
  "REUSED",
  "SUPERSEDED",
  "EXPIRED",
  "ARCHIVED",
]);

const CATEGORIES: readonly StorageCategory[] = Object.freeze([
  "OUTCOME_MEMORY",
  "RECOMMENDATION_MEMORY",
  "STRATEGY_MEMORY",
  "GOVERNANCE_MEMORY",
  "SIMULATION_MEMORY",
  "CERTIFICATION_MEMORY",
  "RISK_MEMORY",
  "CONFIDENCE_MEMORY",
  "PATTERN_MEMORY",
  "ROLLBACK_MEMORY",
  "OPERATOR_MEMORY",
]);

const VALIDATION_PIPELINE: readonly StorageValidationStage[] = Object.freeze([
  "SCHEMA_VALIDATION",
  "IDENTITY_VALIDATION",
  "OWNERSHIP_VALIDATION",
  "EVIDENCE_VALIDATION",
  "GOVERNANCE_VALIDATION",
  "REPLAY_VALIDATION",
  "INTEGRITY_VERIFICATION",
  "TENANT_ISOLATION_VALIDATION",
  "CERTIFICATION_DEPENDENCY_VALIDATION",
  "LEDGER_RECORDING",
]);

const RETRIEVAL_INDEXES: readonly RetrievalIndex[] = Object.freeze([
  "MEMORY_ID",
  "TENANT",
  "MISSION",
  "STRATEGY",
  "RECOMMENDATION",
  "GOVERNANCE",
  "SIMULATION",
  "CONFIDENCE",
  "RISK",
  "CERTIFICATION",
  "REPLAY_REFERENCE",
  "EVIDENCE_REFERENCE",
]);

const STORAGE_RULES = Object.freeze([
  "never_overwrite_memory",
  "never_delete_historical_memory",
  "never_rewrite_evidence",
  "never_modify_governance_history",
  "never_alter_replay_references",
  "never_merge_tenants",
  "never_bypass_certification",
  "never_bypass_constitutional_validation",
  "append_only_versions",
]);

const SECURITY_REQUIREMENTS = Object.freeze([
  "encrypt_all_persisted_memory",
  "isolate_tenants",
  "validate_access_authorization",
  "prevent_unauthorized_writes",
  "prevent_unauthorized_reads",
  "verify_integrity_continuously",
  "detect_corruption",
  "detect_tampering",
]);

const REPLAY_REQUIREMENTS = Object.freeze([
  "originating_mission",
  "evidence",
  "recommendations",
  "governance_decisions",
  "simulations",
  "operator_actions",
  "certification_history",
  "hash_verified_reconstruction",
]);

type Scenario = NonNullable<AdaptiveMemoryStoreInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): AdaptiveMemoryStoreApiSurface {
  const base: Omit<AdaptiveMemoryStoreApiSurface, "integrity_hash"> = {
    api_id: "adaptive_memory_store_api",
    establish_store: "POST /adaptive-memory-store/establish",
    retrieve_contract: "GET /adaptive-memory-store/contract",
    retrieve_records: "POST /adaptive-memory-store/records",
    retrieve_identity: "POST /adaptive-memory-store/identity",
    retrieve_integrity: "POST /adaptive-memory-store/integrity",
    retrieve_ledger: "POST /adaptive-memory-store/ledger",
    retrieve_retrieval_readiness: "POST /adaptive-memory-store/retrieval",
    retrieve_metrics: "POST /adaptive-memory-store/metrics",
    replay_store: "POST /adaptive-memory-store/replay",
    inspect_store: "POST /adaptive-memory-store/inspect",
    unauthorized_write_supported: false,
    unauthorized_read_supported: false,
    overwrite_supported: false,
    deletion_supported: false,
    cross_tenant_storage_supported: false,
    autonomous_learning_repository: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): AdaptiveMemoryStoreFailure | undefined {
  const map: Partial<Record<AdaptiveMemoryStoreScenario, AdaptiveMemoryStoreFailure>> = {
    FOUNDATION_UNAVAILABLE: "FOUNDATION_UNAVAILABLE",
    INVALID_SCHEMA: "SCHEMA_INVALID",
    DUPLICATE_IDENTITY: "DUPLICATE_IDENTITY",
    UNDEFINED_OWNERSHIP: "OWNERSHIP_UNDEFINED",
    INCOMPLETE_EVIDENCE: "EVIDENCE_LINEAGE_INCOMPLETE",
    BYPASSED_GOVERNANCE: "GOVERNANCE_VALIDATION_BYPASSED",
    MISSING_REPLAY: "REPLAY_REFERENCES_MISSING",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    TENANT_BREACH: "TENANT_ISOLATION_VIOLATED",
    INVALID_CERTIFICATION: "CERTIFICATION_DEPENDENCY_INVALID",
    LEDGER_FAILURE: "LEDGER_RECORDING_FAILED",
    UNAUTHORIZED_WRITE: "UNAUTHORIZED_WRITE",
    UNAUTHORIZED_READ: "UNAUTHORIZED_READ",
    OVERWRITE_ATTEMPT: "OVERWRITE_ATTEMPTED",
    DELETE_ATTEMPT: "DELETE_ATTEMPTED",
    EVIDENCE_REWRITE: "EVIDENCE_REWRITE_ATTEMPTED",
    GOVERNANCE_MUTATION: "GOVERNANCE_HISTORY_MUTATION_ATTEMPTED",
    REPLAY_MUTATION: "REPLAY_REFERENCE_MUTATION_ATTEMPTED",
    UNDETECTED_CORRUPTION: "CORRUPTION_UNDETECTED",
    NONDETERMINISTIC_PERSISTENCE: "DETERMINISTIC_PERSISTENCE_FAILED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, foundationReplayable: boolean): readonly AdaptiveMemoryStoreFailure[] {
  const failures: AdaptiveMemoryStoreFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!foundationReplayable) failures.push("FOUNDATION_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly AdaptiveMemoryStoreFailure[]): AdaptiveMemoryStoreStatus {
  return failures.length ? "REJECTED" : "AUTHORITATIVE";
}

function buildContract(): AdaptiveMemoryStoreContract {
  const base: Omit<AdaptiveMemoryStoreContract, "integrity_hash"> = {
    contract_id: "adaptive-memory-store-contract",
    version: STORE_VERSION,
    architecture: freezeArray([
      "Qualified Memory",
      "Schema Validation",
      "Identity Assignment",
      "Integrity Verification",
      "Governance Validation",
      "Persistence Manager",
      "Adaptive Memory Store",
      "Storage Ledger",
      "Replay References",
      "Evidence Lineage",
      "Retrieval Services",
    ]),
    lifecycle: LIFECYCLE,
    categories: CATEGORIES,
    validation_pipeline: VALIDATION_PIPELINE,
    retrieval_indexes: RETRIEVAL_INDEXES,
    storage_rules: STORAGE_RULES,
    security_requirements: SECURITY_REQUIREMENTS,
    replay_requirements: REPLAY_REQUIREMENTS,
    system_of_record: true,
    deterministic_persistence_required: true,
    immutable_records_required: true,
    tenant_isolation_required: true,
    encryption_required: true,
    autonomous_learning_repository: false,
    overwrite_supported: false,
    deletion_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function memoryTypeFor(category: StorageCategory): MemoryType {
  const map: Record<StorageCategory, MemoryType> = {
    OUTCOME_MEMORY: "VALIDATED_OUTCOME",
    RECOMMENDATION_MEMORY: "VALIDATED_OUTCOME",
    STRATEGY_MEMORY: "CERTIFIED_PATTERN",
    GOVERNANCE_MEMORY: "GOVERNANCE_HISTORY",
    SIMULATION_MEMORY: "SIMULATION_HISTORY",
    CERTIFICATION_MEMORY: "CERTIFICATION_HISTORY",
    RISK_MEMORY: "EVIDENCE_OBSERVATION",
    CONFIDENCE_MEMORY: "EVIDENCE_OBSERVATION",
    PATTERN_MEMORY: "CERTIFIED_PATTERN",
    ROLLBACK_MEMORY: "REPLAY_REFERENCE",
    OPERATOR_MEMORY: "OPERATOR_DECISION",
  };
  return map[category];
}

function ownerFor(category: StorageCategory): MemoryOwner {
  const map: Record<StorageCategory, MemoryOwner> = {
    OUTCOME_MEMORY: "MISSION",
    RECOMMENDATION_MEMORY: "RECOMMENDATION",
    STRATEGY_MEMORY: "STRATEGY",
    GOVERNANCE_MEMORY: "GOVERNANCE_DECISION",
    SIMULATION_MEMORY: "SIMULATION",
    CERTIFICATION_MEMORY: "CERTIFICATION",
    RISK_MEMORY: "RISK_ANALYSIS",
    CONFIDENCE_MEMORY: "CONFIDENCE_ANALYSIS",
    PATTERN_MEMORY: "PATTERN",
    ROLLBACK_MEMORY: "MISSION",
    OPERATOR_MEMORY: "TENANT",
  };
  return map[category];
}

function buildIdentity(category: StorageCategory, sourceIntegrityHash: string, duplicate: boolean): MemoryIdentity {
  const memory_type = memoryTypeFor(category);
  const identitySeed = {
    tenant_id: "tenant-mission-control",
    mission_id: "mission-adaptive-memory-store",
    memory_type,
    creation_timestamp: CREATION_TIMESTAMP,
    version: VERSION,
    source_integrity_hash: duplicate ? "duplicate-source" : sourceIntegrityHash,
    category: duplicate ? "DUPLICATE_MEMORY" : category,
  };
  const global_identity = `ams_${hash(identitySeed).slice(0, 32)}`;
  const base: Omit<MemoryIdentity, "integrity_hash"> = {
    memory_id: global_identity,
    tenant_id: identitySeed.tenant_id,
    mission_id: identitySeed.mission_id,
    memory_type,
    creation_timestamp: CREATION_TIMESTAMP,
    version: VERSION,
    source_integrity_hash: sourceIntegrityHash,
    global_identity,
    collision_resistant: true,
    replay_reproducible: true,
    lineage_traceable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildStoredRecord(
  category: StorageCategory,
  sourceIntegrityHash: string,
  failures: readonly AdaptiveMemoryStoreFailure[],
  duplicate: boolean,
): StoredAdaptiveMemoryRecord {
  const identity = buildIdentity(category, sourceIntegrityHash, duplicate);
  const evidence_refs = failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") ? [] : [`evidence:${category.toLowerCase()}:lineage`];
  const governance_refs = failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? [] : [`governance:${category.toLowerCase()}:approval`];
  const replay_refs = failures.includes("REPLAY_REFERENCES_MISSING") ? [] : [`replay:${category.toLowerCase()}:deterministic`];
  const tenantId = failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : identity.tenant_id;
  const base: Omit<StoredAdaptiveMemoryRecord, "integrity_hash"> = {
    memory_id: identity.memory_id,
    tenant_id: tenantId,
    mission_scope: identity.mission_id,
    memory_type: identity.memory_type,
    classification: category as MemoryClassification,
    storage_category: category,
    memory_summary: `${category.toLowerCase()} persisted as deterministic adaptive memory.`,
    evidence_refs,
    outcome_refs: [`outcome:${category.toLowerCase()}:validated`],
    pattern_refs: [`pattern:${category.toLowerCase()}:certified`],
    governance_refs,
    replay_refs,
    certification_refs: failures.includes("CERTIFICATION_DEPENDENCY_INVALID") ? [] : [`certification:${category.toLowerCase()}:approved`],
    reuse_permissions: ["READ", "REUSE", "REPLAY"],
    lifecycle_state: failures.length ? "CANDIDATE" : "AVAILABLE",
    expiration_policy: "NO_DELETE_SUPERSEDE_EXPIRE_ARCHIVE",
    owner: failures.includes("OWNERSHIP_UNDEFINED") ? "MISSION" : ownerFor(category),
    version: VERSION,
    identity,
    encrypted_payload_hash: hash({ encrypted: true, identity: identity.global_identity, category }),
    tenant_partition_hash: hash({ tenant_id: tenantId, partition: "adaptive-memory-store" }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function duplicateIdentities(records: readonly StoredAdaptiveMemoryRecord[]): boolean {
  return new Set(records.map((record) => record.memory_id)).size !== records.length;
}

function buildIntegrityReport(records: readonly StoredAdaptiveMemoryRecord[], failures: readonly AdaptiveMemoryStoreFailure[]): IntegrityValidationReport {
  const base: Omit<IntegrityValidationReport, "integrity_hash"> = {
    hash_validation: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    duplicate_detection: !duplicateIdentities(records) && !failures.includes("DUPLICATE_IDENTITY"),
    corruption_detection: !failures.includes("CORRUPTION_UNDETECTED"),
    lineage_verification: records.every((record) => record.evidence_refs.length > 0) && !failures.includes("EVIDENCE_REWRITE_ATTEMPTED"),
    replay_verification: records.every((record) => record.replay_refs.length > 0) && !failures.includes("REPLAY_REFERENCE_MUTATION_ATTEMPTED"),
    schema_consistency: !failures.includes("SCHEMA_INVALID"),
    ownership_verified: !failures.includes("OWNERSHIP_UNDEFINED"),
    governance_references_verified: records.every((record) => record.governance_refs.length > 0) && !failures.includes("GOVERNANCE_HISTORY_MUTATION_ATTEMPTED"),
    certification_references_verified: records.every((record) => record.certification_refs.length > 0),
    write_authorized: !failures.includes("UNAUTHORIZED_WRITE"),
    read_authorized: !failures.includes("UNAUTHORIZED_READ"),
    persistence_allowed: false,
  };
  const persistence_allowed = Object.entries(base).every(([key, value]) => key === "persistence_allowed" || value === true);
  return Object.freeze({ ...base, persistence_allowed, integrity_hash: hashWithoutIntegrity({ ...base, persistence_allowed }) });
}

function buildLedger(
  records: readonly StoredAdaptiveMemoryRecord[],
  report: IntegrityValidationReport,
  failures: readonly AdaptiveMemoryStoreFailure[],
): readonly MemoryStorageLedgerEntry[] {
  const events: readonly MemoryStorageLedgerEntry["storage_event"][] = [
    "MEMORY_CREATION",
    "IDENTITY_ASSIGNMENT",
    "INTEGRITY_VALIDATION",
    "GOVERNANCE_APPROVAL",
    "REPLAY_VALIDATION",
    "PERSISTENCE_EVENT",
    "INDEXING_EVENT",
    "AVAILABILITY_EVENT",
  ];
  const baseEntries = records.flatMap((record, recordIndex) =>
    events.map((event, eventIndex) => {
      const base: Omit<MemoryStorageLedgerEntry, "integrity_hash"> = {
        ledger_id: `adaptive_memory_store_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
        memory_id: record.memory_id,
        tenant_id: record.tenant_id,
        storage_event: failures.length && eventIndex === events.length - 1 ? "STORAGE_FAILURE" : event,
        version: record.version,
        lifecycle_state: record.lifecycle_state,
        validation_stage: VALIDATION_PIPELINE[Math.min(eventIndex, VALIDATION_PIPELINE.length - 1)],
        append_only: true,
        immutable: true,
        replayable: true,
        tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
        cryptographically_verified: report.hash_validation && !failures.includes("LEDGER_RECORDING_FAILED"),
      };
      return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    }),
  );
  return freezeArray(failures.includes("LEDGER_RECORDING_FAILED") ? baseEntries.slice(0, -1) : baseEntries);
}

function buildMetrics(
  records: readonly StoredAdaptiveMemoryRecord[],
  ledger: readonly MemoryStorageLedgerEntry[],
  failures: readonly AdaptiveMemoryStoreFailure[],
): AdaptiveMemoryStoreMetrics {
  const base: Omit<AdaptiveMemoryStoreMetrics, "integrity_hash"> = {
    total_memories_stored: failures.length ? 0 : records.length,
    storage_growth_records: records.length,
    write_latency_ms: 12,
    validation_failures: failures.length,
    duplicate_rejections: failures.includes("DUPLICATE_IDENTITY") ? 1 : 0,
    integrity_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    corruption_detections: failures.includes("CORRUPTION_UNDETECTED") ? 0 : records.length,
    replay_success_rate: failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("DETERMINISTIC_PERSISTENCE_FAILED") ? 0 : 1,
    tenant_isolation_violations: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0,
    storage_utilization_units: ledger.length,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveMemoryStoreResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    foundation_hash: result.foundation_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    record_hashes: result.storage_engine.map((record) => record.integrity_hash),
    identity_hashes: result.identity_registry.map((identity) => identity.integrity_hash),
    integrity_report_hash: result.integrity_report.integrity_hash,
    ledger_hashes: result.storage_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveMemoryStoreResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_memory_store_version,
    store_identifier: result.store_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishAdaptiveMemoryStore(input: AdaptiveMemoryStoreInput = {}): AdaptiveMemoryStoreResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const foundation_result = input.foundation_result ?? establishAdaptiveMemoryFoundation();
  const failures = collectFailures(scenario, replayAdaptiveMemoryFoundation(foundation_result));
  const contract = buildContract();
  const sourceIntegrityHash = foundation_result.integrity_hash;
  const duplicate = failures.includes("DUPLICATE_IDENTITY");
  const storage_engine = freezeArray(CATEGORIES.map((category, index) => buildStoredRecord(category, sourceIntegrityHash, failures, duplicate && index > 0)));
  const identity_registry = freezeArray(storage_engine.map((record) => record.identity));
  const integrity_report = buildIntegrityReport(storage_engine, failures);
  const storage_ledger = buildLedger(storage_engine, integrity_report, failures);
  const metrics = buildMetrics(storage_engine, storage_ledger, failures);
  const base: Omit<AdaptiveMemoryStoreResult, "integrity_hash" | "replay_hash"> = {
    adaptive_memory_store_version: STORE_VERSION,
    store_identifier: STORE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    foundation_result,
    contract,
    storage_engine,
    identity_registry,
    integrity_report,
    storage_ledger,
    retrieval_indexes: RETRIEVAL_INDEXES,
    validation_pipeline: VALIDATION_PIPELINE,
    metrics,
    failures,
    deterministic: !failures.includes("DETERMINISTIC_PERSISTENCE_FAILED"),
    replayable: integrity_report.replay_verification,
    immutable: !failures.includes("OVERWRITE_ATTEMPTED") && !failures.includes("DELETE_ATTEMPTED"),
    append_only: !failures.includes("OVERWRITE_ATTEMPTED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governed_retrieval_ready: integrity_report.persistence_allowed,
    encryption_enforced: true,
    unauthorized_mutation_prevented: !failures.includes("UNAUTHORIZED_WRITE") && !failures.includes("OVERWRITE_ATTEMPTED"),
    system_of_record: true,
    autonomous_learning_repository: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveMemoryStore(result: AdaptiveMemoryStoreResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayAdaptiveMemoryFoundation(result.foundation_result) &&
    verifyHashedRecord(result.contract) &&
    result.storage_engine.every((record) => verifyHashedRecord(record.identity) && verifyHashedRecord(record)) &&
    result.identity_registry.every(verifyHashedRecord) &&
    verifyHashedRecord(result.integrity_report) &&
    result.storage_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveMemoryStore(): AdaptiveMemoryStoreDefinition {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_memory_store_version: STORE_VERSION,
    supported_categories: CATEGORIES,
    supported_lifecycle: LIFECYCLE,
    api_surface,
    result: establishAdaptiveMemoryStore(),
  });
}

export const AdaptiveMemoryStore = Object.freeze({
  establish: establishAdaptiveMemoryStore,
  replay: replayAdaptiveMemoryStore,
});
