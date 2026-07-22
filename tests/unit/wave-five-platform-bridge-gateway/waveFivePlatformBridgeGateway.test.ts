import { describe, expect, it } from "vitest";

import { getWaveFivePlatformBridgeGatewayBundle, replayWaveFivePlatformBridgeGateway, runWaveFivePlatformBridgeGateway, validateWaveFivePlatformBridgeGateway } from "@/services/wave-five-platform-bridge-gateway";
import type { WaveFivePlatformBridgeGatewayFailure } from "@/types/wave-five-platform-bridge-gateway";

const conditionalFailures = ["EXTERNAL_CONNECTION_FRAMEWORK_MISSING", "SECURE_CREDENTIAL_REFERENCES_MISSING", "CONNECTOR_REGISTRY_MISSING", "CONNECTOR_METADATA_INCOMPLETE", "CONNECTOR_HISTORY_MISSING", "INTEGRATION_CONTRACTS_MISSING", "CONTRACT_VERSIONING_INVALID", "INTEGRATION_CONFIGURATION_MISSING", "CONFIGURATION_HISTORY_MISSING", "INTEGRATION_QUALIFICATION_MISSING", "QUALIFICATION_EVIDENCE_MISSING", "ELIGIBILITY_ENGINE_MISSING", "ELIGIBILITY_HISTORY_MISSING", "LIFECYCLE_ENGINE_MISSING", "LIFECYCLE_EVIDENCE_MISSING", "GOVERNANCE_ENFORCEMENT_MISSING", "OWNERSHIP_VALIDATION_MISSING", "INTEGRATION_EVIDENCE_MISSING", "AUDIT_RECORDS_MISSING", "REPLAY_SUPPORT_MISSING", "ADMIN_EXPERIENCE_MISSING", "LIFECYCLE_VISIBILITY_INCOMPLETE"] as const satisfies readonly WaveFivePlatformBridgeGatewayFailure[];
const notQualifiedFailures = ["W5_PROVING_GROUND_INVALID", "UNMANAGED_EXTERNAL_CONNECTIVITY_ALLOWED", "TRANSPORT_CONFIGURATION_INVALID", "TENANT_SCOPE_INVALID", "CONTRACT_VALIDATION_FAILED", "CONTRACT_FIRST_REQUIREMENT_BYPASSED", "CONFIGURATION_VALIDATION_FAILED", "SECRETS_REFERENCED_INSECURELY", "QUALIFICATION_NONDETERMINISTIC", "ACTIVE_WITHOUT_QUALIFICATION", "ELIGIBILITY_NOT_INDEPENDENT", "ACTIVE_WITHOUT_ELIGIBILITY", "INVALID_LIFECYCLE_TRANSITION_ACCEPTED", "TERMINAL_STATE_MUTATED", "POLICY_EVALUATION_BYPASSED", "TENANT_ISOLATION_BREACH", "INTEGRATION_EVIDENCE_MUTABLE", "APPLICATION_LIFECYCLE_OWNERSHIP_ASSUMED", "APPLICATION_CERTIFICATION_OWNERSHIP_ASSUMED", "PROPRIUM_QUALIFICATION_OWNERSHIP_ASSUMED", "USER_AUTHENTICATION_OWNERSHIP_ASSUMED", "POLICY_AUTHORING_OWNERSHIP_ASSUMED"] as const satisfies readonly WaveFivePlatformBridgeGatewayFailure[];

describe("Wave 5.15 Platform Bridge Gateway Integration", () => {
  it("publishes the Platform Bridge Gateway doctrine", () => {
    const bundle = getWaveFivePlatformBridgeGatewayBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-platform-bridge-gateway/w5.15", platform_bridge_gateway_exclusive: true, contract_first_integration_required: true, deterministic_qualification_required: true, eligibility_independent_from_qualification: true, immutable_transition_evidence_required: true, unmanaged_external_connectivity_prohibited: true, application_lifecycle_ownership_prohibited: true, qualification_gate: "W5.15 Platform Bridge Gateway Integration Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the W5.14 Proving Ground", () => {
    const first = runWaveFivePlatformBridgeGateway({ seed: "deterministic" });
    const second = runWaveFivePlatformBridgeGateway({ seed: "deterministic" });

    expect(first.proving_ground_ref).toBe("wave-five-proprium-proving-ground/w5.14");
    expect(first.provides).toEqual(["external-connection-framework", "connector-registry", "integration-contracts", "integration-configuration", "integration-qualification", "integration-eligibility", "integration-lifecycle", "integration-evidence"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFivePlatformBridgeGateway(first).valid).toBe(true);
    expect(replayWaveFivePlatformBridgeGateway()).toBe(true);
  });

  it("enforces exclusive external connectivity through the gateway", () => {
    const result = runWaveFivePlatformBridgeGateway();

    expect(result.external_connections).toMatchObject({ outbound_connections: true, inbound_integrations: true, protocol_abstraction: true, authentication_adapters: true, endpoint_definitions: true, transport_configuration: true, secure_credential_references: true, connection_manager: true, endpoint_registry: true, transport_layer: true, gateway_exclusive: true, unmanaged_connectivity_blocked: true });
    expect(runWaveFivePlatformBridgeGateway({ scenario: "UNMANAGED_EXTERNAL_CONNECTIVITY_ALLOWED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("tracks connectors and validates contract-first integration", () => {
    const result = runWaveFivePlatformBridgeGateway();

    expect(result.registry_contracts.lifecycle_states).toEqual(["PROPOSED", "REGISTERED", "CONFIGURED", "SANDBOX_TESTING", "QUALIFICATION_IN_PROGRESS", "INTEGRATION_QUALIFIED", "ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED", "RETIRED", "ARCHIVED"]);
    expect(result.registry_contracts).toMatchObject({ connector_registry: true, connector_metadata: true, connector_history: true, tenant_scopes: true, supported_capabilities: true, contract_versions: true, qualification_history: true, eligibility_history: true, integration_contracts: true, contract_registry: true, contract_validation: true, interface_schema_versioned: true, request_response_validation: true, failure_timeout_replay_audit_defined: true, contract_first: true });
    expect(runWaveFivePlatformBridgeGateway({ scenario: "CONTRACT_FIRST_REQUIREMENT_BYPASSED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps qualification deterministic and blocks activation before qualification", () => {
    const result = runWaveFivePlatformBridgeGateway();

    expect(result.configuration_qualification).toMatchObject({ configuration_service: true, endpoint_configuration: true, credentials: true, secret_references: true, protocol_settings: true, timeout_configuration: true, retry_configuration: true, feature_flags: true, tenant_overrides: true, configuration_validation: true, configuration_history: true, qualification_engine: true, connectivity_validation: true, authentication_validation: true, authorization_validation: true, contract_compliance: true, protocol_compatibility: true, schema_validation: true, failure_handling: true, timeout_handling: true, replay_capability: true, audit_generation: true, deterministic_qualification: true, qualification_reports: true, qualification_evidence: true });
    expect(runWaveFivePlatformBridgeGateway({ scenario: "QUALIFICATION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePlatformBridgeGateway({ scenario: "ACTIVE_WITHOUT_QUALIFICATION" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps eligibility independent and enforces canonical lifecycle governance", () => {
    const result = runWaveFivePlatformBridgeGateway();

    expect(result.eligibility_lifecycle_governance).toMatchObject({ eligibility_engine: true, governance_approval: true, tenant_authorization: true, licensing: true, environment_restrictions: true, operational_readiness: true, organizational_policy: true, eligibility_decisions: true, eligibility_history: true, eligibility_independent_from_qualification: true, lifecycle_engine: true, transition_validator: true, lifecycle_history: true, transitions_validated: true, illegal_transitions_rejected: true, terminal_states_immutable: true, ownership_validation: true, contract_validation: true, qualification_verification: true, eligibility_verification: true, policy_evaluation: true, tenant_isolation: true, governance_evidence: true });
    expect(runWaveFivePlatformBridgeGateway({ scenario: "ELIGIBILITY_NOT_INDEPENDENT" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePlatformBridgeGateway({ scenario: "INVALID_LIFECYCLE_TRANSITION_ACCEPTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePlatformBridgeGateway({ scenario: "ACTIVE_WITHOUT_ELIGIBILITY" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("preserves immutable evidence, audit, replay, and admin visibility", () => {
    const result = runWaveFivePlatformBridgeGateway();

    expect(result.evidence_admin).toMatchObject({ registrations: true, configuration_changes: true, qualification_results: true, eligibility_decisions: true, lifecycle_transitions: true, activation_history: true, suspension_history: true, revocation_history: true, integration_evidence: true, audit_records: true, evidence_registry: true, immutable_evidence: true, deterministic_replay_support: true, connector_dashboard: true, lifecycle_timeline: true, qualification_dashboard: true, contract_review: true, transition_approvals: true, evidence_inspection: true, complete_visibility: true });
    expect(runWaveFivePlatformBridgeGateway({ scenario: "INTEGRATION_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("preserves ownership boundaries outside the Platform Bridge Gateway", () => {
    const result = runWaveFivePlatformBridgeGateway();

    expect(result.boundary).toMatchObject({ owns_external_connections: true, owns_connector_registry: true, owns_integration_contracts: true, owns_integration_qualification: true, owns_integration_eligibility: true, owns_application_lifecycle: false, owns_application_certification: false, owns_proprium_qualification: false, owns_user_authentication: false, owns_internal_application_routing: false, owns_trust_standing: false, owns_policy_authoring: false, lifecycle_independent_from_application_lifecycle: true, lifecycle_independent_from_application_certification: true, lifecycle_independent_from_proprium_qualification: true });
    expect(result.readiness.lifecycle_independence_preserved).toBe(true);
    expect(runWaveFivePlatformBridgeGateway({ scenario: "APPLICATION_LIFECYCLE_OWNERSHIP_ASSUMED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePlatformBridgeGateway({ scenario: "POLICY_AUTHORING_OWNERSHIP_ASSUMED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFivePlatformBridgeGateway({ scenario: failure });
    const validation = validateWaveFivePlatformBridgeGateway(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFivePlatformBridgeGateway({ scenario: failure });
    const validation = validateWaveFivePlatformBridgeGateway(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFivePlatformBridgeGateway({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFivePlatformBridgeGateway({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFivePlatformBridgeGateway({ scenario: "PLATFORM_BRIDGE_GATEWAY_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFivePlatformBridgeGateway(notQualified).valid).toBe(false);
  });
});
