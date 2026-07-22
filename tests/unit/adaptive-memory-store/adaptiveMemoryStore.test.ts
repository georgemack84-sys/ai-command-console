import { describe, expect, it } from "vitest";
import {
  establishAdaptiveMemoryStore,
  getAdaptiveMemoryStore,
  replayAdaptiveMemoryStore,
} from "@/services/adaptive-memory-store";
import type {
  AdaptiveMemoryStoreFailure,
  AdaptiveMemoryStoreScenario,
  RetrievalIndex,
  StorageCategory,
  StorageLifecycleState,
  StorageValidationStage,
} from "@/types/adaptive-memory-store";

describe("Mission Control Phase 10.13B Adaptive Memory Store", () => {
  const lifecycle: readonly StorageLifecycleState[] = [
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
  ];

  const categories: readonly StorageCategory[] = [
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
  ];

  const validationPipeline: readonly StorageValidationStage[] = [
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
  ];

  const retrievalIndexes: readonly RetrievalIndex[] = [
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
  ];

  it("publishes the authoritative adaptive memory store contract", () => {
    const store = getAdaptiveMemoryStore();

    expect(store.adaptive_memory_store_version).toBe("adaptive-memory-store/v1");
    expect(store.supported_categories).toEqual(categories);
    expect(store.supported_lifecycle).toEqual(lifecycle);
    expect(store.api_surface.establish_store).toBe("POST /adaptive-memory-store/establish");
    expect(store.api_surface.retrieve_contract).toBe("GET /adaptive-memory-store/contract");
    expect(store.api_surface.unauthorized_write_supported).toBe(false);
    expect(store.api_surface.unauthorized_read_supported).toBe(false);
    expect(store.api_surface.overwrite_supported).toBe(false);
    expect(store.api_surface.deletion_supported).toBe(false);
    expect(store.api_surface.autonomous_learning_repository).toBe(false);
    expect(store.result.store_identifier).toBe("AdaptiveMemoryStore");
    expect(store.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic persisted records, identities, replay, and integrity", () => {
    const first = establishAdaptiveMemoryStore();
    const second = establishAdaptiveMemoryStore();

    expect(first.storage_engine.map((record) => record.integrity_hash)).toEqual(second.storage_engine.map((record) => record.integrity_hash));
    expect(first.identity_registry.map((identity) => identity.global_identity)).toEqual(second.identity_registry.map((identity) => identity.global_identity));
    expect(first.storage_ledger.map((entry) => entry.integrity_hash)).toEqual(second.storage_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveMemoryStore(first)).toBe(true);
  });

  it("defines lifecycle, storage categories, validation pipeline, and retrieval indexes", () => {
    const result = establishAdaptiveMemoryStore();

    expect(result.contract.lifecycle).toEqual(lifecycle);
    expect(result.contract.categories).toEqual(categories);
    expect(result.validation_pipeline).toEqual(validationPipeline);
    expect(result.retrieval_indexes).toEqual(retrievalIndexes);
    expect(result.contract.system_of_record).toBe(true);
    expect(result.contract.deterministic_persistence_required).toBe(true);
    expect(result.contract.encryption_required).toBe(true);
  });

  it("persists every supported storage category as immutable available memory", () => {
    const result = establishAdaptiveMemoryStore();

    expect(result.storage_engine).toHaveLength(11);
    expect(result.storage_engine.map((record) => record.storage_category)).toEqual(categories);
    expect(result.storage_engine.every((record) => record.lifecycle_state === "AVAILABLE")).toBe(true);
    expect(result.storage_engine.every((record) => record.expiration_policy === "NO_DELETE_SUPERSEDE_EXPIRE_ARCHIVE")).toBe(true);
    expect(result.storage_engine.every((record) => record.encrypted_payload_hash.length > 0)).toBe(true);
    expect(result.storage_engine.every((record) => record.tenant_partition_hash.length > 0)).toBe(true);
  });

  it("assigns globally unique deterministic identities with replay lineage", () => {
    const result = establishAdaptiveMemoryStore();
    const uniqueIds = new Set(result.identity_registry.map((identity) => identity.global_identity));

    expect(uniqueIds.size).toBe(result.identity_registry.length);
    expect(result.identity_registry.every((identity) => identity.global_identity.startsWith("ams_"))).toBe(true);
    expect(result.identity_registry.every((identity) => identity.collision_resistant)).toBe(true);
    expect(result.identity_registry.every((identity) => identity.replay_reproducible)).toBe(true);
    expect(result.identity_registry.every((identity) => identity.lineage_traceable)).toBe(true);
  });

  it("requires complete validation before persistence and governed retrieval", () => {
    const result = establishAdaptiveMemoryStore();

    expect(result.integrity_report.hash_validation).toBe(true);
    expect(result.integrity_report.duplicate_detection).toBe(true);
    expect(result.integrity_report.corruption_detection).toBe(true);
    expect(result.integrity_report.lineage_verification).toBe(true);
    expect(result.integrity_report.replay_verification).toBe(true);
    expect(result.integrity_report.schema_consistency).toBe(true);
    expect(result.integrity_report.ownership_verified).toBe(true);
    expect(result.integrity_report.governance_references_verified).toBe(true);
    expect(result.integrity_report.certification_references_verified).toBe(true);
    expect(result.integrity_report.write_authorized).toBe(true);
    expect(result.integrity_report.read_authorized).toBe(true);
    expect(result.integrity_report.persistence_allowed).toBe(true);
    expect(result.governed_retrieval_ready).toBe(true);
  });

  it("records append-only immutable storage ledger events", () => {
    const result = establishAdaptiveMemoryStore();

    expect(result.storage_ledger).toHaveLength(88);
    expect(result.storage_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.storage_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.storage_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.storage_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.storage_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("enforces store-level security and no autonomous learning repository", () => {
    const result = establishAdaptiveMemoryStore();

    expect(result.contract.security_requirements).toContain("encrypt_all_persisted_memory");
    expect(result.contract.security_requirements).toContain("prevent_unauthorized_writes");
    expect(result.contract.storage_rules).toContain("never_overwrite_memory");
    expect(result.contract.storage_rules).toContain("never_delete_historical_memory");
    expect(result.encryption_enforced).toBe(true);
    expect(result.unauthorized_mutation_prevented).toBe(true);
    expect(result.system_of_record).toBe(true);
    expect(result.autonomous_learning_repository).toBe(false);
  });

  it("publishes observability metrics for the storage layer", () => {
    const metrics = establishAdaptiveMemoryStore().metrics;

    expect(metrics.total_memories_stored).toBe(11);
    expect(metrics.storage_growth_records).toBe(11);
    expect(metrics.write_latency_ms).toBe(12);
    expect(metrics.validation_failures).toBe(0);
    expect(metrics.duplicate_rejections).toBe(0);
    expect(metrics.integrity_failures).toBe(0);
    expect(metrics.corruption_detections).toBe(11);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.tenant_isolation_violations).toBe(0);
    expect(metrics.storage_utilization_units).toBe(88);
  });

  it.each([
    ["FOUNDATION_UNAVAILABLE", "FOUNDATION_UNAVAILABLE"],
    ["INVALID_SCHEMA", "SCHEMA_INVALID"],
    ["DUPLICATE_IDENTITY", "DUPLICATE_IDENTITY"],
    ["UNDEFINED_OWNERSHIP", "OWNERSHIP_UNDEFINED"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["BYPASSED_GOVERNANCE", "GOVERNANCE_VALIDATION_BYPASSED"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["INVALID_CERTIFICATION", "CERTIFICATION_DEPENDENCY_INVALID"],
    ["LEDGER_FAILURE", "LEDGER_RECORDING_FAILED"],
    ["UNAUTHORIZED_WRITE", "UNAUTHORIZED_WRITE"],
    ["UNAUTHORIZED_READ", "UNAUTHORIZED_READ"],
    ["OVERWRITE_ATTEMPT", "OVERWRITE_ATTEMPTED"],
    ["DELETE_ATTEMPT", "DELETE_ATTEMPTED"],
    ["EVIDENCE_REWRITE", "EVIDENCE_REWRITE_ATTEMPTED"],
    ["GOVERNANCE_MUTATION", "GOVERNANCE_HISTORY_MUTATION_ATTEMPTED"],
    ["REPLAY_MUTATION", "REPLAY_REFERENCE_MUTATION_ATTEMPTED"],
    ["UNDETECTED_CORRUPTION", "CORRUPTION_UNDETECTED"],
    ["NONDETERMINISTIC_PERSISTENCE", "DETERMINISTIC_PERSISTENCE_FAILED"],
  ] as const)("rejects persistence for %s", (scenario: AdaptiveMemoryStoreScenario, failure: AdaptiveMemoryStoreFailure) => {
    const result = establishAdaptiveMemoryStore({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.total_memories_stored).toBe(0);
    expect(replayAdaptiveMemoryStore(result)).toBe(true);
  });

  it("keeps invalid storage out of governed retrieval readiness", () => {
    const result = establishAdaptiveMemoryStore({ scenario: "MISSING_REPLAY" });

    expect(result.storage_engine.every((record) => record.lifecycle_state === "CANDIDATE")).toBe(true);
    expect(result.integrity_report.persistence_allowed).toBe(false);
    expect(result.governed_retrieval_ready).toBe(false);
    expect(result.metrics.replay_success_rate).toBe(0);
  });

  it("detects nested stored record tampering", () => {
    const result = establishAdaptiveMemoryStore();
    const tampered = {
      ...result,
      storage_engine: [
        {
          ...result.storage_engine[0],
          tenant_id: "tenant-other",
        },
        ...result.storage_engine.slice(1),
      ],
    };

    expect(replayAdaptiveMemoryStore(tampered)).toBe(false);
  });
});
