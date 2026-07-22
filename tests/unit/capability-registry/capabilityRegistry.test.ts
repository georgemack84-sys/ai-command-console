import { describe, expect, it } from "vitest";

import {
  getCapabilityRegistryBundle,
  replayCapabilityRegistry,
  runCapabilityRegistry,
  validateCapabilityRegistry,
} from "@/services/capability-registry";
import type { CapabilityRegistryFailure } from "@/types/capability-registry";

const conditionalFailures = [
  "CAPABILITY_DEFINITION_SYSTEM_MISSING",
  "CAPABILITY_VERSION_REGISTRY_MISSING",
  "COMPOSITION_ENGINE_MISSING",
  "DEPENDENCY_FRAMEWORK_MISSING",
  "DEPENDENCY_HEALTH_MISSING",
  "RISK_CLASSIFICATION_MISSING",
  "MITIGATION_REQUIREMENTS_MISSING",
  "AUTHORITY_CLASSIFICATION_MISSING",
  "TOOL_BINDING_FRAMEWORK_MISSING",
  "TOOL_TRUST_REQUIREMENT_MISSING",
  "VALIDATION_ENGINE_MISSING",
  "NAMESPACE_VALIDATION_FAILED",
  "REGISTRY_APIS_MISSING",
  "GOVERNANCE_INTEGRATION_MISSING",
  "CAPABILITY_EVIDENCE_MISSING",
] as const satisfies readonly CapabilityRegistryFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "CAPABILITY_IDENTITY_NOT_UNIQUE",
  "CAPABILITY_IDENTITY_MUTABLE",
  "CAPABILITY_SCHEMA_INVALID",
  "CIRCULAR_COMPOSITION_ALLOWED",
  "DUPLICATE_COMPOSITION_ALLOWED",
  "UNSUPPORTED_COMPOSITION_ALLOWED",
  "COMPOSITION_AUTHORITY_INCOMPATIBLE",
  "COMPOSITION_LIFECYCLE_INCOMPATIBLE",
  "DEPENDENCY_GRAPH_NON_DETERMINISTIC",
  "DEPENDENCY_CYCLE_UNDETECTED",
  "RISK_INHERITANCE_INVALID",
  "COMPOSITION_RISK_AGGREGATION_FAILED",
  "AUTHORITY_BINDING_INVALID",
  "DELEGATION_VALIDATION_FAILED",
  "EXECUTION_ELIGIBILITY_INVALID",
  "UNAPPROVED_TOOL_BINDING_ALLOWED",
  "TOOL_SECURITY_APPROVAL_FAILED",
  "TOOL_TENANT_RESTRICTION_FAILED",
  "NON_COMPLIANT_CAPABILITY_ACCEPTED",
  "REGISTRY_API_NON_DETERMINISTIC",
  "GOVERNANCE_METADATA_AMBIGUOUS",
  "CAPABILITY_EVIDENCE_NOT_IMMUTABLE",
  "CAPABILITY_REPLAY_INVALID",
] as const satisfies readonly CapabilityRegistryFailure[];

describe("Capability Registry W2.3", () => {
  it("publishes the canonical W2.3 doctrine and qualification bundle", () => {
    const bundle = getCapabilityRegistryBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "capability-registry/w2.3",
      owns_capability_definitions: true,
      owns_capability_composition: true,
      owns_capability_dependencies: true,
      owns_risk_classification: true,
      owns_authority_classification: true,
      owns_tool_bindings: true,
      owns_capability_validation: true,
      owns_capability_apis: true,
      owns_governance_integration: true,
      owns_capability_evidence: true,
      qualification_gate: "Capability Registry Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("CAPABILITY_REGISTRY_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministically to W2.0, W2.1, and W2.2", () => {
    const first = runCapabilityRegistry();
    const second = runCapabilityRegistry();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCapabilityRegistry(first).valid).toBe(true);
    expect(replayCapabilityRegistry(first)).toBe(true);
  });

  it("defines immutable capability identities, schemas, and composition controls", () => {
    const result = runCapabilityRegistry();

    expect(result.definition_system).toMatchObject({
      capability_schema: true,
      metadata_repository: true,
      version_registry: true,
      immutable_identity: true,
      unique_identity: true,
      lifecycle_requirements: true,
      runtime_requirements: true,
      evidence_requirements: true,
    });
    expect(result.composition_engine).toMatchObject({
      hierarchical_composition: true,
      reusable_modules: true,
      inheritance: true,
      specialization: true,
      aggregation: true,
      orchestration: true,
      nested_graphs: true,
      circular_detection: true,
      duplicate_detection: true,
      unsupported_rejection: true,
      authority_compatibility: true,
      lifecycle_compatibility: true,
    });
  });

  it("maintains deterministic dependency, risk, authority, and tool-binding governance", () => {
    const result = runCapabilityRegistry();

    expect(result.dependency_framework).toMatchObject({
      required_capabilities: true,
      optional_capabilities: true,
      runtime_services: true,
      external_services: true,
      registry_dependencies: true,
      infrastructure_dependencies: true,
      policy_dependencies: true,
      security_dependencies: true,
      dependency_lineage: true,
      deterministic_graph: true,
      cycle_free: true,
      dependency_health: true,
    });
    expect(result.risk_classification.categories).toHaveLength(8);
    expect(result.risk_classification.levels).toEqual(["Minimal", "Low", "Moderate", "High", "Critical"]);
    expect(result.risk_classification).toMatchObject({
      risk_inheritance: true,
      composition_risk_aggregation: true,
      policy_compatibility: true,
      mitigation_requirements: true,
      risk_matrix: true,
    });
    expect(result.authority_classification.authority_classes).toHaveLength(8);
    expect(result.authority_classification).toMatchObject({
      execution_authority: true,
      approval_authority: true,
      delegation_authority: true,
      escalation_authority: true,
      revocation_authority: true,
      constitutional_compliance: true,
      authority_inheritance: true,
      delegation_validation: true,
      execution_rules: true,
    });
    expect(result.tool_binding).toMatchObject({
      approved_tools: true,
      apis: true,
      services: true,
      connectors: true,
      runtimes: true,
      models: true,
      external_systems: true,
      authority_compatibility: true,
      security_approval: true,
      tenant_restrictions: true,
      version_compatibility: true,
      trust_requirements: true,
      invocation_policies: true,
    });
  });

  it("validates capabilities through deterministic APIs, evidence, and the qualification gate", () => {
    const result = runCapabilityRegistry();

    expect(result.validation_engine).toMatchObject({
      schema_validation: true,
      dependency_validation: true,
      authority_validation: true,
      lifecycle_validation: true,
      composition_validation: true,
      policy_validation: true,
      tool_validation: true,
      certification_validation: true,
      namespace_validation: true,
      non_compliant_rejection: true,
    });
    expect(result.apis_governance).toMatchObject({
      register_capability: true,
      update_capability: true,
      retrieve_capability: true,
      search_capability: true,
      validate_capability: true,
      resolve_dependencies: true,
      resolve_composition: true,
      resolve_authority: true,
      resolve_tool_bindings: true,
      deterministic_results: true,
      governance_events: true,
      policy_engine_integration: true,
      safety_gate_integration: true,
      planning_engine_integration: true,
      runtime_orchestrator_integration: true,
      replay_integration: true,
    });
    expect(result.evidence.records).toHaveLength(8);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.qualification.gate_decision).toBe("CAPABILITY_REGISTRY_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runCapabilityRegistry({ scenario: failure });
    const validation = validateCapabilityRegistry(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runCapabilityRegistry({ scenario: failure });
    const validation = validateCapabilityRegistry(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit qualification gate failure as not qualified", () => {
    const result = runCapabilityRegistry({ scenario: "CAPABILITY_REGISTRY_QUALIFICATION_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.qualification.gate_decision).toBe("NOT_QUALIFIED");
    expect(validateCapabilityRegistry(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runCapabilityRegistry({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runCapabilityRegistry({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
