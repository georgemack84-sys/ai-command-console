import { describe, expect, it } from "vitest";
import { getStorageFullBundle, replayStorageFull, runStorageFull, validateStorageFull } from "@/services/storage-full";
import type { StorageFullFailure } from "@/types/storage-full";

const CONDITIONAL_FAILURES: readonly StorageFullFailure[] = [
  "STORAGE_PLATFORM_FOUNDATION_MISSING",
  "STORAGE_CLUSTER_UNAVAILABLE",
  "REPLICATION_INVALID",
  "ENCRYPTION_MISSING",
  "CAPACITY_VALIDATION_FAILED",
  "PERFORMANCE_VALIDATION_FAILED",
  "DOCUMENT_STORE_MISSING",
  "DOCUMENT_SCHEMA_INVALID",
  "DOCUMENT_INDEXING_FAILED",
  "DOCUMENT_VERSIONING_FAILED",
  "DOCUMENT_CONSISTENCY_FAILED",
  "OBJECT_STORE_MISSING",
  "OBJECT_BUCKETS_INVALID",
  "OBJECT_INTEGRITY_FAILED",
  "EVENT_STORE_MISSING",
  "EVENT_ORDERING_FAILED",
  "EVENT_REPLAY_SUPPORT_MISSING",
  "IMMUTABLE_LEDGER_MISSING",
  "SNAPSHOT_STORE_MISSING",
  "SNAPSHOT_RECOVERY_FAILED",
  "SNAPSHOT_INTEGRITY_FAILED",
  "SEARCH_INDEX_MISSING",
  "SEARCH_ACCURACY_FAILED",
  "SEARCH_CONSISTENCY_FAILED",
  "BACKUP_SERVICES_MISSING",
  "BACKUP_VERIFICATION_FAILED",
  "BACKUP_RECOVERABILITY_FAILED",
  "RESTORE_SERVICES_MISSING",
  "POINT_IN_TIME_RECOVERY_FAILED",
  "DISASTER_RECOVERY_FAILED",
  "TENANT_RESTORATION_FAILED",
  "RETENTION_MANAGEMENT_MISSING",
  "RETENTION_POLICY_ENFORCEMENT_FAILED",
  "LEGAL_HOLD_FAILED",
  "GOVERNANCE_OVERRIDE_FAILED",
  "QUALIFICATION_EVIDENCE_MISSING",
  "STORAGE_QUALIFICATION_FAILED",
];

describe("W1.2B Storage Full", () => {
  it("publishes storage-full doctrine and validates baseline", () => {
    const bundle = getStorageFullBundle();

    expect(bundle.doctrine.version).toBe("storage-full/w1.2b");
    expect(bundle.doctrine.owns_document_store).toBe(true);
    expect(bundle.doctrine.owns_object_store).toBe(true);
    expect(bundle.doctrine.owns_event_store).toBe(true);
    expect(bundle.doctrine.owns_immutable_ledger).toBe(true);
    expect(bundle.doctrine.owns_snapshot_store).toBe(true);
    expect(bundle.doctrine.owns_search_index).toBe(true);
    expect(bundle.doctrine.owns_backup_restore).toBe(true);
    expect(bundle.doctrine.owns_retention_management).toBe(true);
    expect(bundle.doctrine.owns_storage_qualification).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic enterprise storage activation with W1.2A dependency", () => {
    const first = runStorageFull();
    const second = runStorageFull();

    expect(first.phase_identifier).toBe("StorageFull");
    expect(first.storage_core_ref).toBe("storage-core/w1.2a");
    expect(first.foundation.clusters).toHaveLength(2);
    expect(first.document_store.collections).toHaveLength(6);
    expect(first.object_store.buckets).toHaveLength(4);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateStorageFull(first).valid).toBe(true);
    expect(replayStorageFull(first)).toBe(true);
  });

  it("provides document, object, event, ledger, snapshot, search, backup, restore, and retention services", () => {
    const result = runStorageFull();

    expect(result.foundation.tenant_isolation).toBe(true);
    expect(result.document_store.versioning).toBe(true);
    expect(result.object_store.object_integrity_validated).toBe(true);
    expect(result.event_store.append_only).toBe(true);
    expect(result.event_store.replay_support).toBe(true);
    expect(result.immutable_ledger.cryptographic_chaining).toBe(true);
    expect(result.snapshot_store.point_in_time_recovery).toBe(true);
    expect(result.search_index.deterministic_results).toBe(true);
    expect(result.backup_services.recoverability_validated).toBe(true);
    expect(result.restore_services.disaster_recovery).toBe(true);
    expect(result.retention_management.policy_enforcement).toBe(true);
  });

  it("validates integrity and approves the Storage Infrastructure Gate", () => {
    const result = runStorageFull();

    expect(result.integrity_validation.cryptographic_hashes).toBe(true);
    expect(result.integrity_validation.replication_consistency).toBe(true);
    expect(result.integrity_validation.ledger_integrity).toBe(true);
    expect(result.integrity_validation.tenant_isolation_verified).toBe(true);
    expect(result.qualification.functional).toBe(true);
    expect(result.qualification.durability).toBe(true);
    expect(result.qualification.governance).toBe(true);
    expect(result.qualification.gate_approved).toBe(true);
    expect(result.readiness.decision).toBe("STORAGE_INFRASTRUCTURE_READY");
  });

  it.each(CONDITIONAL_FAILURES)("marks storage full conditionally ready for remediable deficiency %s", (failure) => {
    const result = runStorageFull({ scenario: failure });
    const validation = validateStorageFull(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["SECURITY_FULL_MISSING", "STORAGE_INFRASTRUCTURE_GATE_FAILED"] as const)("marks storage full not ready for entry/gate blocker %s", (failure) => {
    const result = runStorageFull({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_READY");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateStorageFull(result).valid).toBe(false);
  });

  it.each(["W1_2A_STORAGE_CORE_INVALID", "TENANT_ISOLATION_VIOLATED", "EVENT_IMMUTABILITY_FAILED", "LEDGER_APPEND_ONLY_VIOLATED", "LEDGER_CRYPTOGRAPHIC_CHAIN_INVALID", "LEDGER_TIMESTAMP_VALIDATION_FAILED", "STORAGE_INTEGRITY_VALIDATION_FAILED", "REPLICATION_CONSISTENCY_FAILED"] as const)("fails closed for critical storage full defect %s", (failure) => {
    const result = runStorageFull({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateStorageFull(result).valid).toBe(false);
  });

  it("supports ready with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runStorageFull({ scenario: "READY_WITH_OBSERVATIONS" });
    const conditional = runStorageFull({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("READY_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateStorageFull(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
