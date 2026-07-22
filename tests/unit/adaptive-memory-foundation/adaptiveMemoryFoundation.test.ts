import { describe, expect, it } from "vitest";
import {
  establishAdaptiveMemoryFoundation,
  getAdaptiveMemoryFoundation,
  replayAdaptiveMemoryFoundation,
} from "@/services/adaptive-memory-foundation";
import type {
  AdaptiveMemoryFailure,
  AdaptiveMemoryScenario,
  MemoryClassification,
  MemoryLifecycleStage,
  MemoryOwner,
} from "@/types/adaptive-memory-foundation";

describe("Mission Control Phase 10.13A Adaptive Memory Foundation", () => {
  const lifecycle: readonly MemoryLifecycleStage[] = [
    "DISCOVERED",
    "CANDIDATE",
    "VALIDATED",
    "GOVERNANCE_REVIEW",
    "APPROVED",
    "INDEXED",
    "ACTIVE",
    "REUSED",
    "SUPERSEDED",
    "EXPIRED",
    "ARCHIVED",
  ];

  const classifications: readonly MemoryClassification[] = [
    "OUTCOME_MEMORY",
    "RECOMMENDATION_MEMORY",
    "RISK_MEMORY",
    "CONFIDENCE_MEMORY",
    "GOVERNANCE_MEMORY",
    "OPERATOR_MEMORY",
    "STRATEGY_MEMORY",
    "PATTERN_MEMORY",
    "SIMULATION_MEMORY",
    "ROLLBACK_MEMORY",
    "CERTIFICATION_MEMORY",
  ];

  const owners: readonly MemoryOwner[] = [
    "MISSION",
    "TENANT",
    "RECOMMENDATION",
    "PATTERN",
    "STRATEGY",
    "RISK_ANALYSIS",
    "CONFIDENCE_ANALYSIS",
    "GOVERNANCE_DECISION",
    "SIMULATION",
    "CERTIFICATION",
  ];

  it("publishes the authoritative adaptive memory foundation contract", () => {
    const foundation = getAdaptiveMemoryFoundation();

    expect(foundation.adaptive_memory_foundation_version).toBe("adaptive-memory-foundation/v1");
    expect(foundation.supported_lifecycle).toEqual(lifecycle);
    expect(foundation.supported_classifications).toEqual(classifications);
    expect(foundation.api_surface.establish_foundation).toBe("POST /adaptive-memory-foundation/establish");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /adaptive-memory-foundation/contract");
    expect(foundation.api_surface.autonomous_learning_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.cross_tenant_reuse_supported_by_default).toBe(false);
    expect(foundation.api_surface.deletion_supported).toBe(false);
    expect(foundation.result.foundation_identifier).toBe("AdaptiveMemoryFoundation");
    expect(foundation.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic memory foundation hashes and replay", () => {
    const first = establishAdaptiveMemoryFoundation();
    const second = establishAdaptiveMemoryFoundation();

    expect(first.contract.integrity_hash).toBe(second.contract.integrity_hash);
    expect(first.permission_registry.map((entry) => entry.integrity_hash)).toEqual(second.permission_registry.map((entry) => entry.integrity_hash));
    expect(first.memory_records.map((memory) => memory.integrity_hash)).toEqual(second.memory_records.map((memory) => memory.integrity_hash));
    expect(first.foundation_ledger.map((entry) => entry.integrity_hash)).toEqual(second.foundation_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveMemoryFoundation(first)).toBe(true);
  });

  it("defines the required memory contract fields, lifecycle, ownership, and classifications", () => {
    const result = establishAdaptiveMemoryFoundation();

    expect(result.contract.required_fields).toEqual([
      "memory_id",
      "tenant_id",
      "mission_scope",
      "memory_type",
      "memory_summary",
      "evidence_references",
      "outcome_references",
      "pattern_references",
      "governance_references",
      "replay_references",
      "reuse_policy",
      "authority_level",
      "classification",
      "visibility",
      "expiration_policy",
      "integrity_hash",
    ]);
    expect(result.lifecycle).toEqual(lifecycle);
    expect(result.classification_taxonomy).toEqual(classifications);
    expect(result.ownership_model).toEqual(owners);
    expect(result.contract.authority_level).toBe("ADVISORY_ONLY");
    expect(result.contract.deletion_supported).toBe(false);
  });

  it("activates memory only after evidence, replay, governance, integrity, and classification validation", () => {
    const result = establishAdaptiveMemoryFoundation();
    const memory = result.memory_records[0];

    expect(memory.lifecycle_stage).toBe("ACTIVE");
    expect(memory.evidence_validated).toBe(true);
    expect(memory.replay_validated).toBe(true);
    expect(memory.governance_approved).toBe(true);
    expect(memory.integrity_verified).toBe(true);
    expect(memory.certification_valid).toBe(true);
    expect(memory.reuse_authorized).toBe(true);
    expect(result.governance_validation.available_for_reuse).toBe(true);
  });

  it("defines permission registry and governance-before-reuse requirements", () => {
    const result = establishAdaptiveMemoryFoundation();

    expect(result.permission_registry).toHaveLength(10);
    expect(result.permission_registry.every((entry) => entry.permissions.includes("READ"))).toBe(true);
    expect(result.permission_registry.every((entry) => entry.permissions.includes("REPLAY"))).toBe(true);
    expect(result.permission_registry.every((entry) => entry.replay_required)).toBe(true);
    expect(result.permission_registry.every((entry) => entry.archival_policy === "APPEND_ONLY_ARCHIVE")).toBe(true);
    expect(result.reuse_rules).toContain("governance_approval_required");
    expect(result.reuse_rules).toContain("tenant_match_required_unless_explicitly_authorized");
    expect(result.metrics.governance_before_reuse_enforced).toBe(true);
  });

  it("records append-only replayable ledger transitions without deletion", () => {
    const result = establishAdaptiveMemoryFoundation();

    expect(result.foundation_ledger.map((entry) => entry.lifecycle_stage)).toEqual(lifecycle.slice(0, lifecycle.indexOf("ACTIVE") + 1));
    expect(result.foundation_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.foundation_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.foundation_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.foundation_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.metrics.deletion_blocked).toBe(true);
  });

  it("enforces advisory-only constitutional boundaries", () => {
    const result = establishAdaptiveMemoryFoundation();

    expect(result.prohibited_behaviors).toContain("learn_autonomously");
    expect(result.prohibited_behaviors).toContain("bypass_governance");
    expect(result.prohibited_behaviors).toContain("merge_tenants");
    expect(result.constitutional_guarantees).toContain("advisory_only_intelligence");
    expect(result.advisory_only).toBe(true);
    expect(result.authorizes_actions).toBe(false);
    expect(result.authorizes_production_mutation).toBe(false);
    expect(result.authorizes_governance_override).toBe(false);
  });

  it("publishes observability metrics for the foundation", () => {
    const metrics = establishAdaptiveMemoryFoundation().metrics;

    expect(metrics.lifecycle_stage_count).toBe(11);
    expect(metrics.classification_count).toBe(11);
    expect(metrics.owner_count).toBe(10);
    expect(metrics.permission_count).toBe(6);
    expect(metrics.active_memory_count).toBe(1);
    expect(metrics.deterministic_replay_guaranteed).toBe(true);
    expect(metrics.tenant_isolation_preserved).toBe(true);
    expect(metrics.advisory_only_enforced).toBe(true);
  });

  it.each([
    ["DRIFT_DEFENSE_UNAVAILABLE", "DRIFT_DEFENSE_UNAVAILABLE"],
    ["MISSING_EVIDENCE", "EVIDENCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_VALIDATION_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_APPROVAL_MISSING"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VALIDATION_FAILED"],
    ["MISSING_CLASSIFICATION", "CLASSIFICATION_MISSING"],
    ["AMBIGUOUS_OWNER", "OWNERSHIP_AMBIGUOUS"],
    ["TENANT_MISMATCH", "TENANT_ISOLATION_BREACH"],
    ["MISSING_REUSE_AUTHORIZATION", "REUSE_AUTHORIZATION_MISSING"],
    ["INVALID_CERTIFICATION", "CERTIFICATION_INVALID"],
    ["DELETE_ATTEMPT", "DELETE_ATTEMPTED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_MUTATION_ATTEMPTED"],
    ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION_ATTEMPTED"],
    ["AUTONOMOUS_LEARNING", "AUTONOMOUS_LEARNING_ATTEMPTED"],
    ["HIDDEN_MEMORY", "HIDDEN_MEMORY_ATTEMPTED"],
    ["HISTORY_REWRITE", "HISTORY_REWRITE_ATTEMPTED"],
    ["RESTRICTED_EXPOSURE", "RESTRICTED_INFORMATION_EXPOSURE"],
  ] as const)("fails closed for %s", (scenario: AdaptiveMemoryScenario, failure: AdaptiveMemoryFailure) => {
    const result = establishAdaptiveMemoryFoundation({ scenario });

    expect(result.status).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(replayAdaptiveMemoryFoundation(result)).toBe(true);
  });

  it("keeps invalid memories out of ACTIVE lifecycle", () => {
    const result = establishAdaptiveMemoryFoundation({ scenario: "MISSING_REPLAY" });

    expect(result.memory_records[0].lifecycle_stage).toBe("GOVERNANCE_REVIEW");
    expect(result.governance_validation.available_for_reuse).toBe(false);
    expect(result.metrics.active_memory_count).toBe(0);
  });

  it("detects nested memory tampering", () => {
    const result = establishAdaptiveMemoryFoundation();
    const tampered = {
      ...result,
      memory_records: [
        {
          ...result.memory_records[0],
          tenant_id: "tenant-other",
        },
      ],
    };

    expect(replayAdaptiveMemoryFoundation(tampered)).toBe(false);
  });
});
