import { describe, expect, it } from "vitest";
import { getAgentRegistryBundle, replayAgentRegistry, runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import type { AgentRegistryFailure } from "@/types/agent-registry";

const CONDITIONAL_FAILURES: readonly AgentRegistryFailure[] = [
  "AGENT_REGISTRY_MISSING",
  "REGISTRATION_VALIDATION_FAILED",
  "AGENT_IDENTITY_MISSING",
  "VERSIONING_MISSING",
  "VERSION_HISTORY_INCOMPLETE",
  "LINEAGE_MISSING",
  "LINEAGE_INCOMPLETE",
  "DISCOVERY_MISSING",
  "OWNERSHIP_GOVERNANCE_MISSING",
  "OWNERSHIP_VALIDATION_FAILED",
  "CONFIGURATION_REFERENCES_MISSING",
  "CONFIGURATION_REFERENCE_RESOLUTION_FAILED",
  "RUNTIME_ELIGIBILITY_MISSING",
  "CERTIFICATION_REFERENCES_MISSING",
  "CERTIFICATION_REFERENCE_INVALID",
  "TRUST_REFERENCES_MISSING",
  "TRUST_REFERENCE_UNRESOLVED",
  "REGISTRY_EXPLORER_MISSING",
  "LINEAGE_VIEW_MISSING",
  "REGISTRY_EVIDENCE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly AgentRegistryFailure[] = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W1_1B_IDENTITY_FULL_INVALID",
  "W1_4B_REGISTRY_FULL_INVALID",
  "W1_5_CONFIGURATION_PLATFORM_INVALID",
  "W1_7B_SECURITY_FULL_INVALID",
  "REGISTRATION_NON_DETERMINISTIC",
  "AGENT_IDENTITY_MUTABLE",
  "IDENTITY_UNIQUENESS_FAILED",
  "VERSION_ARTIFACT_MUTABLE",
  "LINEAGE_EDGE_MUTABLE",
  "DISCOVERY_NON_DETERMINISTIC",
  "ELIGIBILITY_NOT_COMPUTED",
  "ELIGIBILITY_NON_REPRODUCIBLE",
  "TENANT_ISOLATION_FAILED",
  "CONSTITUTIONAL_COMPLIANCE_FAILED",
  "REGISTRY_EVIDENCE_NOT_IMMUTABLE",
  "REGISTRY_REPLAY_INVALID",
];

describe("W2.1 Agent Registry", () => {
  it("publishes agent-registry doctrine and validates baseline", () => {
    const bundle = getAgentRegistryBundle();

    expect(bundle.doctrine.version).toBe("agent-registry/w2.1");
    expect(bundle.doctrine.owns_agent_registry).toBe(true);
    expect(bundle.doctrine.owns_agent_identity_model).toBe(true);
    expect(bundle.doctrine.owns_agent_versioning).toBe(true);
    expect(bundle.doctrine.owns_agent_lineage).toBe(true);
    expect(bundle.doctrine.owns_agent_discovery).toBe(true);
    expect(bundle.doctrine.owns_runtime_eligibility).toBe(true);
    expect(bundle.doctrine.owns_certification_references).toBe(true);
    expect(bundle.doctrine.owns_trust_references).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("Agent Registry Qualification Gate");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic agent registry qualification with dependency references", () => {
    const first = runAgentRegistry();
    const second = runAgentRegistry();

    expect(first.phase_identifier).toBe("AgentRegistry");
    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.identity_full_ref).toBe("identity-full/w1.1b");
    expect(first.registry_full_ref).toBe("registry-full/w1.4b");
    expect(first.configuration_platform_ref).toBe("configuration-platform/w1.5");
    expect(first.security_full_ref).toBe("security-full/w1.7b");
    expect(first.evidence.records).toHaveLength(10);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAgentRegistry(first).valid).toBe(true);
    expect(replayAgentRegistry(first)).toBe(true);
  });

  it("qualifies registration, immutable identity, versioning, lineage, and deterministic discovery", () => {
    const result = runAgentRegistry();

    expect(result.registry_service.agent_registration).toBe(true);
    expect(result.registry_service.deterministic_retrieval).toBe(true);
    expect(result.registry_service.tenant_isolation).toBe(true);
    expect(result.identity_model.immutable_identity).toBe(true);
    expect(result.identity_model.identity_uniqueness).toBe(true);
    expect(result.versioning.semantic_versions).toBe(true);
    expect(result.versioning.immutable_version_artifacts).toBe(true);
    expect(result.lineage.immutable_edges).toBe(true);
    expect(result.lineage.queryable).toBe(true);
    expect(result.discovery.identity_lookup).toBe(true);
    expect(result.discovery.trust_lookup).toBe(true);
    expect(result.discovery.deterministic_results).toBe(true);
  });

  it("qualifies ownership, configuration references, eligibility, certification/trust, explorer, evidence, and gate", () => {
    const result = runAgentRegistry();

    expect(result.ownership.responsible_authority).toBe(true);
    expect(result.ownership.ownership_evidence_events).toBe(true);
    expect(result.configuration_references.external_values_only).toBe(true);
    expect(result.configuration_references.references_resolve).toBe(true);
    expect(result.runtime_eligibility.computed_not_assigned).toBe(true);
    expect(result.runtime_eligibility.reproducible).toBe(true);
    expect(result.certification_trust.certification_identifier).toBe(true);
    expect(result.certification_trust.trust_identifier).toBe(true);
    expect(result.certification_trust.external_evaluations_only).toBe(true);
    expect(result.explorer.lineage_view).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.qualification.gate_decision).toBe("AGENT_REGISTRY_QUALIFIED");
    expect(result.readiness.decision).toBe("AGENT_REGISTRY_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks agent registry conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runAgentRegistry({ scenario: failure });
    const validation = validateAgentRegistry(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks agent registry not qualified when the qualification gate fails", () => {
    const result = runAgentRegistry({ scenario: "AGENT_REGISTRY_QUALIFICATION_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateAgentRegistry(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical agent registry defect %s", (failure) => {
    const result = runAgentRegistry({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateAgentRegistry(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runAgentRegistry({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runAgentRegistry({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateAgentRegistry(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
