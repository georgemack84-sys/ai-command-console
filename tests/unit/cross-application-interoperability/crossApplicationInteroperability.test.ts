import { describe, expect, it } from "vitest";
import { getCrossApplicationInteroperabilityBundle, replayCrossApplicationInteroperability, runCrossApplicationInteroperability, validateCrossApplicationInteroperability } from "@/services/cross-application-interoperability";
import type { CrossApplicationInteroperabilityScenario } from "@/types/cross-application-interoperability";

describe("Program 4 P4.19 Cross-Application Interoperability", () => {
  it("publishes doctrine that owns federation and orchestration without owning shared infrastructure", () => {
    const bundle = getCrossApplicationInteroperabilityBundle();

    expect(bundle.doctrine.version).toBe("cross-application-interoperability/v4.19");
    expect(bundle.doctrine.owns_application_federation).toBe(true);
    expect(bundle.doctrine.owns_shared_workflows).toBe(true);
    expect(bundle.doctrine.owns_interoperability).toBe(true);
    expect(bundle.doctrine.owns_orchestration).toBe(true);
    expect(bundle.doctrine.owns_messaging_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_transport_protocols).toBe(false);
    expect(bundle.doctrine.owns_authentication_services).toBe(false);
    expect(bundle.doctrine.owns_authorization_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_replay_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_application_lifecycle).toBe(false);
    expect(bundle.doctrine.owns_governance_policy_definition).toBe(false);
    expect(bundle.doctrine.owns_certification_execution).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic federation, communication, workflow, identity, replay, and readiness records", () => {
    const first = runCrossApplicationInteroperability();
    const second = runCrossApplicationInteroperability();

    expect(first.phase_identifier).toBe("CrossApplicationInteroperability");
    expect(first.application_factory_ref).toBe("application-factory/v4.18");
    expect(first.federation.federation_lifecycle).toEqual([
      "Application Discovery",
      "Federation Qualification",
      "Contract Validation",
      "Identity Propagation",
      "Authority Validation",
      "Policy Validation",
      "Safety Validation",
      "Workflow Orchestration",
    ]);
    expect(first.communication.event_contract_refs).toContain("contract:event:application-federation");
    expect(first.workflows.deterministic_workflows).toBe(true);
    expect(first.governance.authority_validator_ref).toBe("caf:authority-gate");
    expect(first.governance.defines_policy).toBe(false);
    expect(first.identity.tenant_boundary_ref).toBe("tenant-boundary:federation");
    expect(first.replay_audit.replayable).toBe(true);
    expect(first.replay_audit.owns_replay_infrastructure).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCrossApplicationInteroperability(first).valid).toBe(true);
    expect(replayCrossApplicationInteroperability(first)).toBe(true);
  });

  it("certifies compatibility, observability, tenant isolation, replay evidence, and audit completeness", () => {
    const result = runCrossApplicationInteroperability();

    expect(result.validation.interface_compatibility).toBe(true);
    expect(result.validation.workflow_compatibility).toBe(true);
    expect(result.validation.governance_compatibility).toBe(true);
    expect(result.validation.dependency_verified).toBe(true);
    expect(result.validation.federation_integrity).toBe(true);
    expect(result.readiness.federation_integrity_ready).toBe(true);
    expect(result.readiness.workflow_determinism_ready).toBe(true);
    expect(result.readiness.governance_enforcement_ready).toBe(true);
    expect(result.readiness.tenant_isolation_ready).toBe(true);
    expect(result.readiness.observability_ready).toBe(true);
    expect(result.readiness.replay_evidence_ready).toBe(true);
    expect(result.readiness.audit_complete).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_18_APPLICATION_FACTORY_INVALID",
    "P4_17_STEVN_INVALID",
    "P4_16_APEX_INVALID",
    "P4_15_AURORA_INVALID",
    "P4_14_PUBLISHER_OS_INVALID",
    "P4_13_PBG_INVALID",
    "P4_12_QCI_INVALID",
    "P4_11_MISSION_CONTROL_INVALID",
    "P4_10_OBSERVABILITY_INVALID",
    "P4_9_REPLAY_AUDIT_INVALID",
    "P4_8_GOVERNANCE_BINDING_INVALID",
    "P4_6_INTEGRATION_FRAMEWORK_INVALID",
    "CCI_MESSAGING_UNAVAILABLE",
    "CCI_IDENTITY_UNAVAILABLE",
    "CCI_GOVERNANCE_UNAVAILABLE",
    "CAF_AUTHORITY_GATE_UNAVAILABLE",
    "CAF_POLICY_GATE_UNAVAILABLE",
    "CAF_SAFETY_GATE_UNAVAILABLE",
    "INTEROPERABILITY_FOUNDATION_MISSING",
    "FEDERATION_FRAMEWORK_MISSING",
    "FEDERATION_REGISTRY_MISSING",
    "FEDERATION_MEMBERSHIP_INVALID",
    "COMMUNICATION_CONTRACTS_MISSING",
    "EVENT_CONTRACTS_MISSING",
    "REQUEST_RESPONSE_CONTRACTS_MISSING",
    "SHARED_WORKFLOW_ORCHESTRATION_MISSING",
    "WORKFLOW_REGISTRY_MISSING",
    "WORKFLOW_NONDETERMINISTIC",
    "GOVERNANCE_VALIDATORS_MISSING",
    "AUTHORITY_VALIDATION_MISSING",
    "POLICY_VALIDATION_MISSING",
    "SAFETY_VALIDATION_MISSING",
    "APPROVAL_ROUTING_MISSING",
    "IDENTITY_PROPAGATION_MISSING",
    "CONTEXT_TRANSFER_INVALID",
    "TENANT_BOUNDARY_INVALID",
    "SESSION_CONTINUITY_INVALID",
    "FEDERATION_OBSERVABILITY_MISSING",
    "WORKFLOW_TELEMETRY_MISSING",
    "COLLABORATION_DIAGNOSTICS_MISSING",
    "REPLAY_AUDIT_INTEGRATION_MISSING",
    "EVIDENCE_LINKAGE_MISSING",
    "WORKFLOW_LINEAGE_MISSING",
    "CONTRACT_VALIDATION_MISSING",
    "INTERFACE_COMPATIBILITY_INVALID",
    "WORKFLOW_COMPATIBILITY_INVALID",
    "GOVERNANCE_COMPATIBILITY_INVALID",
    "FEDERATION_INTEGRITY_INVALID",
    "CERTIFICATION_READINESS_FAILED",
    "REPLAY_EVIDENCE_UNAVAILABLE",
    "AUDIT_INCOMPLETE",
    "MESSAGING_INFRASTRUCTURE_OWNERSHIP_ATTEMPTED",
    "TRANSPORT_PROTOCOL_OWNERSHIP_ATTEMPTED",
    "AUTHENTICATION_SERVICE_OWNERSHIP_ATTEMPTED",
    "AUTHORIZATION_INFRASTRUCTURE_OWNERSHIP_ATTEMPTED",
    "REPLAY_INFRASTRUCTURE_OWNERSHIP_ATTEMPTED",
    "EVIDENCE_STORAGE_OWNERSHIP_ATTEMPTED",
    "APPLICATION_LIFECYCLE_OWNERSHIP_ATTEMPTED",
    "GOVERNANCE_POLICY_DEFINITION_ATTEMPTED",
    "CERTIFICATION_EXECUTION_ATTEMPTED",
  ] as const)("fails interoperability certification for %s", (scenario: CrossApplicationInteroperabilityScenario) => {
    const result = runCrossApplicationInteroperability({ scenario });
    const validation = validateCrossApplicationInteroperability(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runCrossApplicationInteroperability({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
