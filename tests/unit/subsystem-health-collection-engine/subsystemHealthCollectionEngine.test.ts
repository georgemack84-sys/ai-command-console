import { describe, expect, it, vi } from "vitest";
import {
  buildSubsystemHealthCollectionObservabilitySurface,
  collectSubsystemHealth,
  getSubsystemHealthCollectionEngineContract,
  replaySubsystemHealthCollection,
  validateSubsystemHealthCollection,
} from "@/services/subsystem-health-collection-engine";
import type { SubsystemHealthCollectionFailure, SubsystemHealthCollectionScenario } from "@/types/subsystem-health-collection-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.2 Subsystem Health Collection Engine", () => {
  it("defines the observation-only collection doctrine", () => {
    const contract = getSubsystemHealthCollectionEngineContract();

    expect(contract.doctrine.engine_version).toBe("subsystem-health-collection-engine/v8ALT.4.2");
    expect(contract.doctrine.principles).toContain("deterministic-collection");
    expect(contract.doctrine.principles).toContain("observation-only");
    expect(contract.doctrine.supported_subsystems.length).toBe(8);
    expect(contract.validation.valid).toBe(true);
  });

  it("collects standardized health records from all certified subsystems", () => {
    const collection = collectSubsystemHealth();
    const validation = validateSubsystemHealthCollection(collection);

    expect(collection.overall_collection_status).toBe("COMPLETE");
    expect(collection.subsystems.length).toBe(8);
    expect(collection.normalized_metrics.length).toBe(8);
    expect(collection.evidence_references.length).toBe(8);
    expect(validation.valid).toBe(true);
  });

  it("normalizes metrics deterministically and preserves deterministic ordering", () => {
    const first = collectSubsystemHealth();
    const second = collectSubsystemHealth();

    expect(first.collection_hash).toBe(second.collection_hash);
    expect(first.subsystems.map((item) => item.subsystem_id)).toEqual([...first.subsystems.map((item) => item.subsystem_id)].sort());
    expect(first.normalized_metrics.map((item) => item.metric_hash)).toEqual(second.normalized_metrics.map((item) => item.metric_hash));
  });

  it("captures stability, degradation, alerts, anomalies, and failure classifications", () => {
    const collection = collectSubsystemHealth();

    expect(collection.subsystems.every((item) => item.stability_metrics.stability_hash)).toBe(true);
    expect(collection.subsystems.every((item) => item.degradation_state)).toBe(true);
    expect(collection.subsystems.flatMap((item) => item.alerts).length).toBe(8);
    expect(collection.subsystems.flatMap((item) => item.anomalies).length).toBeGreaterThan(0);
    expect(collection.subsystems.flatMap((item) => item.failures).length).toBe(0);
  });

  it("registers evidence, lineage, replay, and integrity deterministically", () => {
    const collection = collectSubsystemHealth();
    const replay = replaySubsystemHealthCollection(collection);

    expect(collection.evidence_references.every((item) => item.evidence_hash && item.lineage_reference && item.replay_reference && item.integrity_hash)).toBe(true);
    expect(collection.lineage_reference).toBeTruthy();
    expect(collection.replay_reference).toBeTruthy();
    expect(collection.integrity_hash).toBeTruthy();
    expect(replay.deterministic).toBe(true);
  });

  it("enforces governance, authority, tenant ownership, and advisory-only behavior", () => {
    const collection = collectSubsystemHealth();
    const validation = validateSubsystemHealthCollection(collection);

    expect(collection.tenant_id).toBe("tenant:autonomy:primary");
    expect(collection.corrective_action_executed).toBe(false);
    expect(collection.recovery_initiated).toBe(false);
    expect(collection.subsystem_state_modified).toBe(false);
    expect(collection.governance_modified).toBe(false);
    expect(collection.authority_escalated).toBe(false);
    expect(validation.authority_validation_enforced).toBe(true);
    expect(validation.governance_validation_enforced).toBe(true);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["SCHEMA_INVALID", "HEALTH_SCHEMA_INVALID"],
    ["DUPLICATE_SUBMISSION", "DUPLICATE_SUBMISSION_DETECTED"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["INVALID_CONFIDENCE", "CONFIDENCE_INVALID"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_LINEAGE", "LINEAGE_REFERENCE_MISSING"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["AUTHORITY_FAILURE", "AUTHORITY_VALIDATION_FAILED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CROSS_TENANT_REPORT", "TENANT_OWNERSHIP_INVALID"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [SubsystemHealthCollectionScenario, SubsystemHealthCollectionFailure][])("rejects %s", (scenario, failure) => {
    const collection = collectSubsystemHealth({ scenario });
    const validation = validateSubsystemHealthCollection(collection);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible collection diagnostics", () => {
    const surface = buildSubsystemHealthCollectionObservabilitySurface(collectSubsystemHealth());

    expect(surface.subsystem_count).toBe(8);
    expect(surface.alert_count).toBe(8);
    expect(surface.anomaly_count).toBeGreaterThan(0);
    expect(surface.failure_count).toBe(0);
    expect(surface.overall_collection_status).toBe("COMPLETE");
    expect(surface.advisory_only).toBe(true);
  });
});
