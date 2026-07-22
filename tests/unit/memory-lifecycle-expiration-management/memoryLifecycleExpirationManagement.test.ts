import { describe, expect, it } from "vitest";
import {
  establishMemoryLifecycleExpirationManagement,
  getMemoryLifecycleExpirationManagement,
  replayMemoryLifecycleExpirationManagement,
} from "@/services/memory-lifecycle-expiration-management";
import type {
  LifecycleTransitionOutcome,
  LifecycleValidator,
  MemoryLifecycleFailure,
  MemoryLifecycleScenario,
  MemoryLifecycleState,
} from "@/types/memory-lifecycle-expiration-management";

describe("Mission Control Phase 10.13J Memory Lifecycle & Expiration Management", () => {
  const states: readonly MemoryLifecycleState[] = [
    "CANDIDATE",
    "QUALIFIED",
    "APPROVED",
    "ACTIVE",
    "REFERENCED",
    "SUPERSEDED",
    "ARCHIVED",
    "EXPIRED",
    "HISTORICAL",
  ];

  const validators: readonly LifecycleValidator[] = [
    "LIFECYCLE_VALIDATION",
    "GOVERNANCE_VALIDATION",
    "RETENTION_EVALUATION",
    "EXPIRATION_EVALUATION",
    "SUPERSESSION_EVALUATION",
    "ARCHIVAL_VALIDATION",
    "REPLAY_VALIDATION",
    "TENANT_OWNERSHIP_VALIDATION",
    "INTEGRITY_VERIFICATION",
  ];

  const outcomes: readonly LifecycleTransitionOutcome[] = ["TRANSITION_APPROVED", "TRANSITION_DENIED"];

  it("publishes the authoritative lifecycle management contract", () => {
    const manager = getMemoryLifecycleExpirationManagement();

    expect(manager.memory_lifecycle_version).toBe("memory-lifecycle-expiration-management/v1");
    expect(manager.supported_states).toEqual(states);
    expect(manager.supported_validators).toEqual(validators);
    expect(manager.supported_outcomes).toEqual(outcomes);
    expect(manager.api_surface.establish_manager).toBe("POST /memory-lifecycle-expiration-management/establish");
    expect(manager.api_surface.retrieve_contract).toBe("GET /memory-lifecycle-expiration-management/contract");
    expect(manager.api_surface.historical_deletion_supported).toBe(false);
    expect(manager.api_surface.destructive_expiration_supported).toBe(false);
    expect(manager.api_surface.supersession_overwrite_supported).toBe(false);
    expect(manager.result.manager_identifier).toBe("MemoryLifecycleExpirationManagement");
    expect(manager.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic lifecycle records, ledger, metrics, and integrity", () => {
    const first = establishMemoryLifecycleExpirationManagement();
    const second = establishMemoryLifecycleExpirationManagement();

    expect(first.lifecycle_records.map((record) => record.integrity_hash)).toEqual(second.lifecycle_records.map((record) => record.integrity_hash));
    expect(first.lifecycle_ledger.map((entry) => entry.integrity_hash)).toEqual(second.lifecycle_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayMemoryLifecycleExpirationManagement(first)).toBe(true);
  });

  it("governs lifecycle transitions without information loss", () => {
    const result = establishMemoryLifecycleExpirationManagement();

    expect(result.lifecycle_records).toHaveLength(10);
    expect(result.lifecycle_records.every((record) => record.transition_outcome === "TRANSITION_APPROVED")).toBe(true);
    expect(result.lifecycle_records.every((record) => record.historical_memory_preserved)).toBe(true);
    expect(result.lifecycle_records.every((record) => record.replay_available)).toBe(true);
    expect(result.lifecycle_records.every((record) => record.validation_reports.every((report) => report.valid))).toBe(true);
  });

  it("keeps expiration availability-only and replayable", () => {
    const result = establishMemoryLifecycleExpirationManagement();
    const expired = result.lifecycle_records.filter((record) => record.new_state === "EXPIRED");

    expect(expired.length).toBeGreaterThan(0);
    expect(expired.every((record) => record.operationally_available === false)).toBe(true);
    expect(expired.every((record) => record.historical_memory_preserved)).toBe(true);
    expect(expired.every((record) => record.replay_available)).toBe(true);
    expect(expired.every((record) => record.expiration_policy.preserves_replayability)).toBe(true);
  });

  it("preserves supersession lineage without overwriting previous memory", () => {
    const superseded = establishMemoryLifecycleExpirationManagement().lifecycle_records.filter((record) => record.new_state === "SUPERSEDED");

    expect(superseded.length).toBeGreaterThan(0);
    expect(superseded.every((record) => record.supersession_refs.length === 1)).toBe(true);
    expect(superseded.every((record) => record.previous_state === "REFERENCED")).toBe(true);
    expect(superseded.every((record) => record.historical_memory_preserved)).toBe(true);
  });

  it("publishes lifecycle observability metrics", () => {
    const metrics = establishMemoryLifecycleExpirationManagement().metrics;

    expect(metrics.lifecycle_transitions).toBe(10);
    expect(metrics.activation_count).toBe(2);
    expect(metrics.supersession_count).toBe(2);
    expect(metrics.expiration_count).toBe(2);
    expect(metrics.archival_count).toBe(2);
    expect(metrics.retention_compliance).toBe(1);
    expect(metrics.replay_success).toBe(1);
    expect(metrics.lifecycle_latency_ms).toBe(6);
    expect(metrics.transition_failures).toBe(0);
    expect(metrics.policy_violations).toBe(0);
  });

  it("records append-only immutable lifecycle ledger events", () => {
    const result = establishMemoryLifecycleExpirationManagement();

    expect(result.lifecycle_ledger).toHaveLength(100);
    expect(result.lifecycle_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.lifecycle_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.lifecycle_ledger.every((entry) => entry.deterministic)).toBe(true);
    expect(result.lifecycle_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.lifecycle_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.lifecycle_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("enforces historical permanence and advisory-only lifecycle control", () => {
    const result = establishMemoryLifecycleExpirationManagement();

    expect(result.contract.history_is_permanent).toBe(true);
    expect(result.contract.lifecycle_without_information_loss).toBe(true);
    expect(result.contract.governance_before_transition).toBe(true);
    expect(result.contract.replay_across_time).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.deletion_supported).toBe(false);
    expect(result.historical_deletion_prevented).toBe(true);
    expect(result.advisory_only).toBe(true);
  });

  it.each([
    ["REPLAY_ENGINE_UNAVAILABLE", "REPLAY_ENGINE_UNAVAILABLE"],
    ["HISTORICAL_DELETION", "HISTORICAL_MEMORY_DELETED"],
    ["SUPERSESSION_OVERWRITE", "SUPERSESSION_OVERWROTE_PREVIOUS_MEMORY"],
    ["EXPIRATION_REPLAY_REMOVAL", "EXPIRATION_REMOVED_REPLAY_CAPABILITY"],
    ["NONDETERMINISTIC_TRANSITION", "LIFECYCLE_TRANSITION_NONDETERMINISTIC"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_VALIDATION_BYPASSED"],
    ["REPLAY_CONTINUITY_BREAK", "REPLAY_CONTINUITY_BROKEN"],
    ["EVIDENCE_LINEAGE_LOSS", "EVIDENCE_LINEAGE_LOST"],
    ["UNAUTHORIZED_TRANSITION", "UNAUTHORIZED_LIFECYCLE_TRANSITION"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] as const)("rejects unsafe lifecycle condition %s", (scenario: MemoryLifecycleScenario, failure: MemoryLifecycleFailure) => {
    const result = establishMemoryLifecycleExpirationManagement({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.lifecycle_records.every((record) => record.transition_outcome === "TRANSITION_DENIED")).toBe(true);
    expect(result.metrics.transition_failures).toBe(10);
    expect(replayMemoryLifecycleExpirationManagement(result)).toBe(true);
  });

  it("detects historical deletion and replay-breaking expiration", () => {
    const deletion = establishMemoryLifecycleExpirationManagement({ scenario: "HISTORICAL_DELETION" });
    const expiration = establishMemoryLifecycleExpirationManagement({ scenario: "EXPIRATION_REPLAY_REMOVAL" });

    expect(deletion.historical_deletion_prevented).toBe(false);
    expect(deletion.lifecycle_records.every((record) => record.historical_memory_preserved === false)).toBe(true);
    expect(expiration.replay_continuity_preserved).toBe(false);
    expect(expiration.lifecycle_records.every((record) => record.replay_available === false)).toBe(true);
    expect(expiration.lifecycle_records.every((record) => record.expiration_policy.preserves_replayability === false)).toBe(true);
  });

  it("preserves tenant isolation across lifecycle records", () => {
    const result = establishMemoryLifecycleExpirationManagement();

    expect(result.tenant_isolation_enforced).toBe(true);
    expect(result.lifecycle_records.every((record) => record.tenant_id === result.replay_result.replay_records.find((replay) => replay.memory_id === record.memory_id)?.tenant_id)).toBe(true);
  });

  it("detects nested lifecycle record tampering", () => {
    const result = establishMemoryLifecycleExpirationManagement();
    const tampered = {
      ...result,
      lifecycle_records: [
        {
          ...result.lifecycle_records[0],
          new_state: "HISTORICAL" as const,
        },
        ...result.lifecycle_records.slice(1),
      ],
    };

    expect(replayMemoryLifecycleExpirationManagement(tampered)).toBe(false);
  });
});
