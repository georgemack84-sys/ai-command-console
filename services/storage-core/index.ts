import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import { runPlatformBootstrapAuthority, validatePlatformBootstrapAuthority } from "@/services/platform-bootstrap-authority";
import type { StorageCoreBundle, StorageCoreDecision, StorageCoreFailure, StorageCoreInput, StorageCoreResult, StorageCoreScenario, StorageCoreValidation } from "@/types/storage-core";

const VERSION = "storage-core/w1.2a" as const;
const IDENTIFIER = "StorageCore" as const;
let bootstrapBaseline: ReturnType<typeof runPlatformBootstrapAuthority> | undefined;
let identityCoreBaseline: ReturnType<typeof runIdentityCore> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly StorageCoreFailure[], failure: StorageCoreFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: StorageCoreScenario): StorageCoreFailure | undefined { return scenario === "BASELINE" || scenario === "ACTIVE_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly StorageCoreFailure[], scenario: StorageCoreScenario): StorageCoreDecision {
  if (has(failures, "W1_0_BOOTSTRAP_INVALID") || has(failures, "W1_1A_IDENTITY_CORE_INVALID") || has(failures, "AUDIT_STORAGE_NOT_APPEND_ONLY") || has(failures, "AUDIT_STORAGE_NOT_IMMUTABLE") || has(failures, "CONFIGURATION_HISTORY_NOT_IMMUTABLE") || has(failures, "DOCUMENT_HISTORY_NOT_IMMUTABLE") || has(failures, "HASH_GENERATION_FAILED") || has(failures, "CHECKSUM_VALIDATION_FAILED") || has(failures, "CORRUPTION_DETECTION_FAILED") || has(failures, "STORAGE_VERIFICATION_FAILED")) return "FAIL_CLOSED";
  if (has(failures, "SECURITY_CORE_MISSING") || has(failures, "CORE_ACTIVATION_FAILED")) return "NOT_ACTIVE";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP") return "CONDITIONALLY_ACTIVE";
  if (scenario === "ACTIVE_WITH_OBSERVATIONS") return "ACTIVE_WITH_OBSERVATIONS";
  return "CORE_ACTIVATED";
}
function resultReplayHash(result: Omit<StorageCoreResult, "replay_hash" | "integrity_hash">): string { return hash({ architecture: result.architecture.integrity_hash, deployment: result.deployment.integrity_hash, configuration: result.configuration_repository.integrity_hash, document: result.document_repository.integrity_hash, audit: result.audit_storage.integrity_hash, metadata: result.transaction_metadata.integrity_hash, integrity_service: result.integrity_service.integrity_hash, backup: result.backup_recovery.integrity_hash, durability: result.durability_validation.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<StorageCoreResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runStorageCore(input: StorageCoreInput = {}): StorageCoreResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<StorageCoreFailure>(direct ? [direct] : []);
  bootstrapBaseline ??= runPlatformBootstrapAuthority();
  identityCoreBaseline ??= runIdentityCore();
  const bootstrapInvalid = !validatePlatformBootstrapAuthority(bootstrapBaseline).valid || has(scenarioFailures, "W1_0_BOOTSTRAP_INVALID");
  const identityInvalid = !validateIdentityCore(identityCoreBaseline).valid || has(scenarioFailures, "W1_1A_IDENTITY_CORE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(bootstrapInvalid ? ["W1_0_BOOTSTRAP_INVALID" as const] : []), ...(identityInvalid ? ["W1_1A_IDENTITY_CORE_INVALID" as const] : [])])]);
  const dependenciesOk = !bootstrapInvalid && !identityInvalid && !has(failures, "SECURITY_CORE_MISSING");
  const architectureOk = !has(failures, "STORAGE_ARCHITECTURE_MISSING") && !has(failures, "PERSISTENCE_TOPOLOGY_INVALID") && !has(failures, "STORAGE_BOUNDARIES_INVALID");
  const deploymentOk = !has(failures, "PERSISTENT_STORAGE_DEPLOYMENT_MISSING") && !has(failures, "DURABLE_STORAGE_ENGINE_UNAVAILABLE") && !has(failures, "DOCUMENT_PERSISTENCE_FAILED") && !has(failures, "CONFIGURATION_PERSISTENCE_FAILED") && !has(failures, "METADATA_PERSISTENCE_FAILED");
  const configurationOk = !has(failures, "CONFIGURATION_REPOSITORY_MISSING") && !has(failures, "CONFIGURATION_VERSION_HISTORY_INVALID") && !has(failures, "CONFIGURATION_ROLLBACK_FAILED") && !has(failures, "CONFIGURATION_HISTORY_NOT_IMMUTABLE");
  const documentOk = !has(failures, "DOCUMENT_REPOSITORY_MISSING") && !has(failures, "DOCUMENT_VERSION_HISTORY_INVALID") && !has(failures, "DOCUMENT_HISTORY_NOT_IMMUTABLE");
  const auditOk = !has(failures, "AUDIT_LEDGER_STORAGE_MISSING") && !has(failures, "AUDIT_STORAGE_NOT_APPEND_ONLY") && !has(failures, "AUDIT_STORAGE_NOT_IMMUTABLE") && !has(failures, "AUDIT_INDEX_MISSING") && !has(failures, "RETENTION_POLICY_MISSING");
  const metadataOk = !has(failures, "TRANSACTION_METADATA_MISSING") && !has(failures, "CORRELATION_REGISTRY_MISSING") && !has(failures, "LINEAGE_METADATA_MISSING");
  const integrityOk = !has(failures, "INTEGRITY_SERVICE_MISSING") && !has(failures, "HASH_GENERATION_FAILED") && !has(failures, "CHECKSUM_VALIDATION_FAILED") && !has(failures, "CORRUPTION_DETECTION_FAILED") && !has(failures, "STORAGE_VERIFICATION_FAILED");
  const backupOk = !has(failures, "BACKUP_REPOSITORY_MISSING") && !has(failures, "RECOVERY_PROCEDURES_MISSING") && !has(failures, "RESTORATION_VALIDATION_FAILED");
  const durabilityOk = !has(failures, "DURABILITY_VALIDATION_FAILED") && !has(failures, "RESTART_RECOVERY_FAILED") && !has(failures, "FAILURE_RECOVERY_FAILED");
  const activationEvidenceOk = !has(failures, "ACTIVATION_EVIDENCE_MISSING");
  const decision = decisionFor(failures, scenario);
  const architecture = nested({ architecture_id: architectureOk ? `architecture:w1.2a:storage:${input.seed ?? "canonical"}` : "", persistence_topology: architectureOk, storage_boundaries: architectureOk, storage_lifecycle: architectureOk, redundancy_architecture: architectureOk, specifications: architectureOk ? freezeArray(["configuration-store", "document-store", "audit-storage", "transaction-metadata", "integrity-service"]) : freezeArray<string>([]) });
  const deployment = nested({ deployment_id: deploymentOk ? "deployment:w1.2a:persistent-storage" : "", durable_storage_engines: deploymentOk, document_persistence: deploymentOk, configuration_persistence: deploymentOk, metadata_persistence: deploymentOk, persistent_volumes: deploymentOk ? freezeArray(["volume:documents", "volume:configuration", "volume:audit", "volume:metadata"]) : freezeArray<string>([]), production_storage: deploymentOk });
  const configuration_repository = nested({ repository_id: configurationOk ? "repository:w1.2a:configuration" : "", configuration_database: configurationOk, version_control: configurationOk, rollback_support: configurationOk, immutable_history: configurationOk, snapshots: configurationOk ? freezeArray(["snapshot:platform", "snapshot:tenant", "snapshot:namespace", "snapshot:runtime"]) : freezeArray<string>([]) });
  const document_repository = nested({ repository_id: documentOk ? "repository:w1.2a:documents" : "", document_storage: documentOk, version_management: documentOk, immutable_revisions: documentOk, lifecycle_management: documentOk, document_registry: documentOk ? freezeArray(["specifications", "governance-artifacts", "manifests", "policies", "evidence-documents", "registry-documents"]) : freezeArray<string>([]) });
  const audit_storage = nested({ ledger_id: auditOk ? "ledger:w1.2a:audit-storage" : "", append_only: auditOk, immutable_event_recording: auditOk, audit_indexing: auditOk, retention_policies: auditOk, archive: auditOk ? "archive:w1.2a:audit" : "", records: auditOk ? freezeArray(["audit:governance", "audit:authorization", "audit:security", "audit:lifecycle"]) : freezeArray<string>([]) });
  const transaction_metadata = nested({ registry_id: metadataOk ? "registry:w1.2a:transactions" : "", transaction_catalog: metadataOk, execution_metadata: metadataOk, correlation_identifiers: metadataOk, lineage_metadata: metadataOk, metadata_catalog: metadataOk ? freezeArray(["transaction-id", "timestamp", "correlation-id", "lineage", "execution"]) : freezeArray<string>([]) });
  const integrity_service = nested({ service_id: integrityOk ? "service:w1.2a:integrity" : "", hash_generation: integrityOk, checksum_validation: integrityOk, corruption_detection: integrityOk, integrity_verification: integrityOk, storage_validation: integrityOk, verification_records: integrityOk ? freezeArray(["verification:configuration", "verification:documents", "verification:audit", "verification:metadata"]) : freezeArray<string>([]) });
  const backup_recovery = nested({ repository_id: backupOk ? "repository:w1.2a:backup" : "", backup_policies: backupOk, recovery_validation: backupOk, restoration_procedures: backupOk, recovery_verification: backupOk, validation_reports: backupOk ? freezeArray(["report:backup", "report:restore", "report:recovery"]) : freezeArray<string>([]) });
  const durability_validation = nested({ report_id: durabilityOk ? "report:w1.2a:durability" : "", storage_persistence: durabilityOk, restart_recovery: durabilityOk, failure_recovery: durabilityOk, integrity_preservation: durabilityOk && integrityOk, audit_immutability: durabilityOk && auditOk, evidence_recorded: durabilityOk && activationEvidenceOk });
  const readiness = nested({ readiness_id: "W1.2A-STORAGE-CORE-READINESS-001", decision, phase_ready: decision === "CORE_ACTIVATED" || decision === "ACTIVE_WITH_OBSERVATIONS", dependencies_ready: dependenciesOk, architecture_ready: architectureOk, deployment_ready: deploymentOk, configuration_ready: configurationOk, document_ready: documentOk, audit_ready: auditOk, metadata_ready: metadataOk, integrity_ready: integrityOk, backup_recovery_ready: backupOk, durability_ready: durabilityOk, activation_evidence_ready: activationEvidenceOk, failures });
  const base: Omit<StorageCoreResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, bootstrap_ref: "platform-bootstrap-authority/w1.0", identity_core_ref: "identity-core/w1.1a", architecture, deployment, configuration_repository, document_repository, audit_storage, transaction_metadata, integrity_service, backup_recovery, durability_validation, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateStorageCore(result?: StorageCoreResult): StorageCoreValidation {
  if (!result) return nested({ valid: false, decision: "NOT_ACTIVE" as const, replay_hash_valid: false, integrity_hash_valid: false, architecture_valid: false, deployment_valid: false, configuration_valid: false, document_valid: false, audit_valid: false, metadata_valid: false, integrity_service_valid: false, backup_recovery_valid: false, durability_valid: false, readiness_valid: false, failures: freezeArray(["STORAGE_ARCHITECTURE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const architecture_valid = verifyHashed(result.architecture) && result.architecture.persistence_topology && result.architecture.specifications.length >= 5;
  const deployment_valid = verifyHashed(result.deployment) && result.deployment.durable_storage_engines && result.deployment.persistent_volumes.length >= 4 && result.deployment.production_storage;
  const configuration_valid = verifyHashed(result.configuration_repository) && result.configuration_repository.version_control && result.configuration_repository.rollback_support && result.configuration_repository.immutable_history;
  const document_valid = verifyHashed(result.document_repository) && result.document_repository.document_storage && result.document_repository.version_management && result.document_repository.immutable_revisions;
  const audit_valid = verifyHashed(result.audit_storage) && result.audit_storage.append_only && result.audit_storage.immutable_event_recording && result.audit_storage.audit_indexing && result.audit_storage.records.length >= 4;
  const metadata_valid = verifyHashed(result.transaction_metadata) && result.transaction_metadata.transaction_catalog && result.transaction_metadata.correlation_identifiers && result.transaction_metadata.lineage_metadata;
  const integrity_service_valid = verifyHashed(result.integrity_service) && result.integrity_service.hash_generation && result.integrity_service.checksum_validation && result.integrity_service.corruption_detection && result.integrity_service.storage_validation;
  const backup_recovery_valid = verifyHashed(result.backup_recovery) && result.backup_recovery.backup_policies && result.backup_recovery.recovery_validation && result.backup_recovery.recovery_verification;
  const durability_valid = verifyHashed(result.durability_validation) && result.durability_validation.storage_persistence && result.durability_validation.restart_recovery && result.durability_validation.failure_recovery && result.durability_validation.audit_immutability;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && architecture_valid && deployment_valid && configuration_valid && document_valid && audit_valid && metadata_valid && integrity_service_valid && backup_recovery_valid && durability_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, architecture_valid, deployment_valid, configuration_valid, document_valid, audit_valid, metadata_valid, integrity_service_valid, backup_recovery_valid, durability_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayStorageCore(result = runStorageCore()): boolean { const scenario = result.readiness.decision === "ACTIVE_WITH_OBSERVATIONS" ? { scenario: "ACTIVE_WITH_OBSERVATIONS" as const } : {}; const replayed = runStorageCore(scenario); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateStorageCore(result).valid; }
export function getStorageCoreBundle(): StorageCoreBundle { const result = runStorageCore(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_document_persistence: true, owns_configuration_persistence: true, owns_append_only_audit_storage: true, owns_transaction_metadata: true, owns_integrity_hashing: true, owns_recovery_foundation: true }), result, validation: validateStorageCore(result) }); }
export const StorageCoreService = Object.freeze({ run: runStorageCore, validate: validateStorageCore, replay: replayStorageCore });
