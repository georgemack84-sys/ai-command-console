import { describe, expect, it } from "vitest";
import { getStorageCoreBundle, replayStorageCore, runStorageCore, validateStorageCore } from "@/services/storage-core";
import type { StorageCoreFailure } from "@/types/storage-core";

const CONDITIONAL_FAILURES: readonly StorageCoreFailure[] = [
  "STORAGE_ARCHITECTURE_MISSING",
  "PERSISTENCE_TOPOLOGY_INVALID",
  "STORAGE_BOUNDARIES_INVALID",
  "PERSISTENT_STORAGE_DEPLOYMENT_MISSING",
  "DURABLE_STORAGE_ENGINE_UNAVAILABLE",
  "DOCUMENT_PERSISTENCE_FAILED",
  "CONFIGURATION_PERSISTENCE_FAILED",
  "METADATA_PERSISTENCE_FAILED",
  "CONFIGURATION_REPOSITORY_MISSING",
  "CONFIGURATION_VERSION_HISTORY_INVALID",
  "CONFIGURATION_ROLLBACK_FAILED",
  "DOCUMENT_REPOSITORY_MISSING",
  "DOCUMENT_VERSION_HISTORY_INVALID",
  "AUDIT_LEDGER_STORAGE_MISSING",
  "AUDIT_INDEX_MISSING",
  "RETENTION_POLICY_MISSING",
  "TRANSACTION_METADATA_MISSING",
  "CORRELATION_REGISTRY_MISSING",
  "LINEAGE_METADATA_MISSING",
  "INTEGRITY_SERVICE_MISSING",
  "BACKUP_REPOSITORY_MISSING",
  "RECOVERY_PROCEDURES_MISSING",
  "RESTORATION_VALIDATION_FAILED",
  "DURABILITY_VALIDATION_FAILED",
  "RESTART_RECOVERY_FAILED",
  "FAILURE_RECOVERY_FAILED",
  "ACTIVATION_EVIDENCE_MISSING",
];

describe("W1.2A Storage Core", () => {
  it("publishes storage doctrine and validates baseline activation", () => {
    const bundle = getStorageCoreBundle();

    expect(bundle.doctrine.version).toBe("storage-core/w1.2a");
    expect(bundle.doctrine.owns_document_persistence).toBe(true);
    expect(bundle.doctrine.owns_configuration_persistence).toBe(true);
    expect(bundle.doctrine.owns_append_only_audit_storage).toBe(true);
    expect(bundle.doctrine.owns_transaction_metadata).toBe(true);
    expect(bundle.doctrine.owns_integrity_hashing).toBe(true);
    expect(bundle.doctrine.owns_recovery_foundation).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic storage activation with bootstrap and identity dependencies", () => {
    const first = runStorageCore();
    const second = runStorageCore();

    expect(first.phase_identifier).toBe("StorageCore");
    expect(first.bootstrap_ref).toBe("platform-bootstrap-authority/w1.0");
    expect(first.identity_core_ref).toBe("identity-core/w1.1a");
    expect(first.architecture.specifications).toHaveLength(5);
    expect(first.deployment.persistent_volumes).toHaveLength(4);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateStorageCore(first).valid).toBe(true);
    expect(replayStorageCore(first)).toBe(true);
  });

  it("provides configuration, document, audit, metadata, integrity, backup, and durability outputs", () => {
    const result = runStorageCore();

    expect(result.configuration_repository.immutable_history).toBe(true);
    expect(result.configuration_repository.rollback_support).toBe(true);
    expect(result.document_repository.immutable_revisions).toBe(true);
    expect(result.audit_storage.append_only).toBe(true);
    expect(result.audit_storage.immutable_event_recording).toBe(true);
    expect(result.transaction_metadata.correlation_identifiers).toBe(true);
    expect(result.integrity_service.corruption_detection).toBe(true);
    expect(result.backup_recovery.recovery_verification).toBe(true);
    expect(result.durability_validation.restart_recovery).toBe(true);
  });

  it("achieves CORE_ACTIVATED readiness", () => {
    const result = runStorageCore();

    expect(result.readiness.decision).toBe("CORE_ACTIVATED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.dependencies_ready).toBe(true);
    expect(result.readiness.configuration_ready).toBe(true);
    expect(result.readiness.document_ready).toBe(true);
    expect(result.readiness.audit_ready).toBe(true);
    expect(result.readiness.integrity_ready).toBe(true);
    expect(result.readiness.backup_recovery_ready).toBe(true);
    expect(result.readiness.durability_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks storage core conditionally active for remediable deficiency %s", (failure) => {
    const result = runStorageCore({ scenario: failure });
    const validation = validateStorageCore(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["SECURITY_CORE_MISSING", "CORE_ACTIVATION_FAILED"] as const)("marks storage core not active for entry/gate blocker %s", (failure) => {
    const result = runStorageCore({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_ACTIVE");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateStorageCore(result).valid).toBe(false);
  });

  it.each(["W1_0_BOOTSTRAP_INVALID", "W1_1A_IDENTITY_CORE_INVALID", "AUDIT_STORAGE_NOT_APPEND_ONLY", "AUDIT_STORAGE_NOT_IMMUTABLE", "CONFIGURATION_HISTORY_NOT_IMMUTABLE", "DOCUMENT_HISTORY_NOT_IMMUTABLE", "HASH_GENERATION_FAILED", "CHECKSUM_VALIDATION_FAILED", "CORRUPTION_DETECTION_FAILED", "STORAGE_VERIFICATION_FAILED"] as const)("fails closed for critical storage trust or integrity defect %s", (failure) => {
    const result = runStorageCore({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateStorageCore(result).valid).toBe(false);
  });

  it("supports active with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runStorageCore({ scenario: "ACTIVE_WITH_OBSERVATIONS" });
    const conditional = runStorageCore({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("ACTIVE_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateStorageCore(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
