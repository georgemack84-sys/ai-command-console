import { describe, expect, it } from "vitest";
import { getRegistryFullBundle, replayRegistryFull, runRegistryFull, validateRegistryFull } from "@/services/registry-full";
import type { RegistryFullFailure } from "@/types/registry-full";

const CONDITIONAL_FAILURES: readonly RegistryFullFailure[] = [
  "CONFIGURATION_PLATFORM_INVALID",
  "OBSERVABILITY_PLATFORM_INVALID",
  "REGISTRY_EXPLORER_MISSING",
  "EXPLORER_NON_DETERMINISTIC",
  "RELATIONSHIP_GRAPH_INCOMPLETE",
  "REGISTRY_SEARCH_MISSING",
  "SEARCH_INDEX_INCOMPLETE",
  "DEPENDENCY_ENGINE_MISSING",
  "DEPENDENCY_GRAPH_INCOMPLETE",
  "MISSING_DEPENDENCIES_UNDETECTED",
  "CIRCULAR_DEPENDENCIES_UNDETECTED",
  "DEPENDENCY_AUTHORITY_VIOLATION_UNDETECTED",
  "COMPATIBILITY_ENGINE_MISSING",
  "COMPATIBILITY_EVALUATION_NON_DETERMINISTIC",
  "REGISTRY_LINEAGE_MISSING",
  "LINEAGE_INCOMPLETE",
  "LIFECYCLE_GOVERNANCE_MISSING",
  "LIFECYCLE_APPROVAL_NOT_ENFORCED",
  "LIFECYCLE_NON_DETERMINISTIC",
  "CONTRACT_VALIDATION_ENGINE_MISSING",
  "CONSTITUTIONAL_VALIDATION_MISSING",
  "QUALIFICATION_FRAMEWORK_MISSING",
  "QUALIFICATION_EVIDENCE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly RegistryFullFailure[] = [
  "W1_1B_IDENTITY_FULL_INVALID",
  "W1_2B_STORAGE_FULL_INVALID",
  "W1_3B_MESSAGING_FULL_INVALID",
  "W1_4A_REGISTRY_CORE_INVALID",
  "SECURITY_FULL_INVALID",
  "SEARCH_NON_DETERMINISTIC",
  "INCOMPATIBLE_DEPLOYMENT_ALLOWED",
  "LINEAGE_NOT_REPLAYABLE",
  "INVALID_CONTRACT_ALLOWED",
  "GOVERNANCE_AUTHORITY_VALIDATION_FAILED",
  "TENANT_ISOLATION_FAILED",
  "AUDIT_INTEGRITY_FAILED",
  "QUALIFICATION_EVIDENCE_NOT_IMMUTABLE",
];

describe("W1.4B Registry Full", () => {
  it("publishes registry-full doctrine and validates baseline", () => {
    const bundle = getRegistryFullBundle();

    expect(bundle.doctrine.version).toBe("registry-full/w1.4b");
    expect(bundle.doctrine.owns_registry_explorer).toBe(true);
    expect(bundle.doctrine.owns_registry_search).toBe(true);
    expect(bundle.doctrine.owns_dependency_intelligence).toBe(true);
    expect(bundle.doctrine.owns_compatibility_evaluation).toBe(true);
    expect(bundle.doctrine.owns_registry_lineage).toBe(true);
    expect(bundle.doctrine.owns_lifecycle_governance).toBe(true);
    expect(bundle.doctrine.owns_contract_validation).toBe(true);
    expect(bundle.doctrine.owns_registry_qualification).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("Registry Infrastructure Gate");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic registry infrastructure qualification with full predecessor references", () => {
    const first = runRegistryFull();
    const second = runRegistryFull();

    expect(first.phase_identifier).toBe("RegistryFull");
    expect(first.identity_full_ref).toBe("identity-full/w1.1b");
    expect(first.storage_full_ref).toBe("storage-full/w1.2b");
    expect(first.messaging_full_ref).toBe("messaging-full/w1.3b");
    expect(first.registry_core_ref).toBe("registry-core/w1.4a");
    expect(first.evidence.records).toHaveLength(7);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateRegistryFull(first).valid).toBe(true);
    expect(replayRegistryFull(first)).toBe(true);
  });

  it("qualifies explorer and deterministic search capabilities", () => {
    const result = runRegistryFull();

    expect(result.explorer.hierarchical_browsing).toBe(true);
    expect(result.explorer.namespace_traversal).toBe(true);
    expect(result.explorer.ownership_visualization).toBe(true);
    expect(result.explorer.relationship_graph).toBe(true);
    expect(result.explorer.deterministic).toBe(true);
    expect(result.search.indexed_registry).toBe(true);
    expect(result.search.contract_search).toBe(true);
    expect(result.search.identity_search).toBe(true);
    expect(result.search.lifecycle_filtering).toBe(true);
    expect(result.search.deterministic_results).toBe(true);
  });

  it("qualifies dependency intelligence, compatibility evaluation, lineage, and lifecycle governance", () => {
    const result = runRegistryFull();

    expect(result.dependency_intelligence.dependency_graph).toBe(true);
    expect(result.dependency_intelligence.missing_detection).toBe(true);
    expect(result.dependency_intelligence.cycle_detection).toBe(true);
    expect(result.dependency_intelligence.authority_validation).toBe(true);
    expect(result.compatibility.compatibility_matrix).toBe(true);
    expect(result.compatibility.schema_compatibility).toBe(true);
    expect(result.compatibility.policy_compatibility).toBe(true);
    expect(result.compatibility.deterministic_evaluation).toBe(true);
    expect(result.lineage.qualification_history).toBe(true);
    expect(result.lineage.replayable).toBe(true);
    expect(result.lineage.complete).toBe(true);
    expect(result.lifecycle_governance.approval).toBe(true);
    expect(result.lifecycle_governance.retirement).toBe(true);
    expect(result.lifecycle_governance.authority_enforcement).toBe(true);
    expect(result.lifecycle_governance.deterministic_workflows).toBe(true);
  });

  it("qualifies contract validation, evidence, and the Registry Infrastructure Gate", () => {
    const result = runRegistryFull();

    expect(result.contract_validation.schema_correctness).toBe(true);
    expect(result.contract_validation.policy_compliance).toBe(true);
    expect(result.contract_validation.authority_validation).toBe(true);
    expect(result.contract_validation.invalid_contract_rejection).toBe(true);
    expect(result.evidence.search_evidence).toBe(true);
    expect(result.evidence.dependency_evidence).toBe(true);
    expect(result.evidence.compatibility_evidence).toBe(true);
    expect(result.evidence.lineage_evidence).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.qualification.deterministic_queries).toBe(true);
    expect(result.qualification.governance_enforcement).toBe(true);
    expect(result.qualification.tenant_isolation).toBe(true);
    expect(result.qualification.gate_decision).toBe("QUALIFIED");
    expect(result.readiness.decision).toBe("QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks registry full conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runRegistryFull({ scenario: failure });
    const validation = validateRegistryFull(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks registry full not qualified when the infrastructure gate fails", () => {
    const result = runRegistryFull({ scenario: "REGISTRY_INFRASTRUCTURE_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateRegistryFull(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical registry full defect %s", (failure) => {
    const result = runRegistryFull({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateRegistryFull(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runRegistryFull({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runRegistryFull({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateRegistryFull(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
