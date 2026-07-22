import { describe, expect, it } from "vitest";
import { getStevnBundle, replayStevn, runStevn, validateStevn } from "@/services/stevn";
import type { StevnScenario } from "@/types/stevn";

describe("Program 4 P4.17 STEVN Application", () => {
  it("publishes STEVN Application doctrine without claiming the STEVN Framework or shared infrastructure", () => {
    const bundle = getStevnBundle();

    expect(bundle.doctrine.version).toBe("stevn-application/v4.17");
    expect(bundle.doctrine.owns_stevn_application).toBe(true);
    expect(bundle.doctrine.owns_stevn_framework).toBe(false);
    expect(bundle.doctrine.owns_mission_control_architecture).toBe(false);
    expect(bundle.doctrine.owns_cci_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_caf_runtime).toBe(false);
    expect(bundle.doctrine.owns_governance_engines).toBe(false);
    expect(bundle.doctrine.owns_replay_engine).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_certification_engine).toBe(false);
    expect(bundle.doctrine.advisory_boundary).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic application records with qualified application and framework namespaces", () => {
    const first = runStevn();
    const second = runStevn();

    expect(first.phase_identifier).toBe("STEVNApplication");
    expect(first.mission_control_ref).toBe("mission-control/v4.11");
    expect(first.foundation.application_name).toBe("STEVN Application");
    expect(first.foundation.application_namespace).toBe("civitas.application.stevn");
    expect(first.foundation.framework_namespace).toBe("mission_control.framework.stevn");
    expect(first.foundation.owns_application).toBe(true);
    expect(first.foundation.owns_framework).toBe(false);
    expect(first.foundation.distinction_contract_ref).toBe("contract:stevn-application-framework-distinction");
    expect(first.foundation.namespace_collision_free).toBe(true);
    expect(first.capabilities.classifications).toContain("STEVN_FRAMEWORK_CONSUMED");
    expect(first.capabilities.hidden_capabilities).toHaveLength(0);
    expect(first.domain_model.core_records).toContain("STEVNApplicationOperationalRecord");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateStevn(first).valid).toBe(true);
    expect(replayStevn(first)).toBe(true);
  });

  it("preserves governed CAF, Mission Control, CCI, evidence, replay, and production activation boundaries", () => {
    const result = runStevn();

    expect(result.integrations.cci_bindings).toContain("identity");
    expect(result.integrations.cci_bindings).toContain("certification");
    expect(result.integrations.caf_gate_sequence).toEqual([
      "Resolve authority requirement",
      "Capture operator approval when required",
      "CAF Authority Gate",
      "CAF Policy Gate",
      "CAF Safety Gate",
      "Resolve warning disposition",
      "Execution admission",
      "Authorized execution",
    ]);
    expect(result.integrations.framework_interfaces).toEqual(["READ_ONLY", "ADVISORY_INPUT", "EVIDENCE_REFERENCE", "REPLAY_REFERENCE"]);
    expect(result.governance.expands_authority).toBe(false);
    expect(result.governance.bypasses_governance).toBe(false);
    expect(result.governance.bypasses_operator).toBe(false);
    expect(result.evidence.material_evidence_complete).toBe(true);
    expect(result.evidence.owns_canonical_storage).toBe(false);
    expect(result.replay.unexplained_divergence).toBe(false);
    expect(result.replay.executes_replay_engine).toBe(false);
    expect(result.lifecycle.rollback_validated).toBe(true);
    expect(result.lifecycle.activation_prevented_when_uncertified).toBe(true);
    expect(result.activation.activated).toBe(true);
  });

  it("certifies and activates the STEVN Application for governed ecosystem operation", () => {
    const result = runStevn();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.status).toBe("CERTIFIED");
    expect(result.certification.decision).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.distinction_verified).toBe(true);
    expect(result.certification.namespace_integrity).toBe(true);
    expect(result.certification.capability_complete).toBe(true);
    expect(result.certification.integrations_validated).toBe(true);
    expect(result.certification.governance_compliant).toBe(true);
    expect(result.certification.evidence_complete).toBe(true);
    expect(result.certification.replay_passed).toBe(true);
    expect(result.certification.observability_operational).toBe(true);
    expect(result.certification.tenant_isolation_passed).toBe(true);
    expect(result.certification.rollback_ready).toBe(true);
    expect(result.certification.production_ready).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
    expect(result.activation.certificate_ref).toBe(result.certification.certification_id);
  });

  it.each([
    "P4_11_MISSION_CONTROL_INVALID",
    "P4_10_OPERATIONAL_INTELLIGENCE_INVALID",
    "P4_9_REPLAY_AUDIT_INVALID",
    "P4_8_GOVERNANCE_BINDING_INVALID",
    "P4_7_EVIDENCE_GOVERNANCE_INVALID",
    "PROGRAM_1_CAPABILITY_ATLAS_INVALID",
    "PROGRAM_2_CCI_INVALID",
    "PROGRAM_3_CAF_INVALID",
    "STEVN_APPLICATION_MISSING",
    "APPLICATION_CONSTITUTION_MISSING",
    "APPLICATION_FRAMEWORK_DISTINCTION_MISSING",
    "AMBIGUOUS_STEVN_TERMINOLOGY",
    "FRAMEWORK_OWNERSHIP_CONFLICT",
    "NAMESPACE_COLLISION",
    "APPLICATION_REGISTRATION_MISSING",
    "IDENTITY_RECORD_MISSING",
    "CAPABILITY_MAP_MISSING",
    "HIDDEN_CAPABILITY",
    "CAPABILITY_DEPENDENCY_UNAVAILABLE",
    "DOMAIN_MODEL_MISSING",
    "WORKFLOW_STATE_MODEL_INVALID",
    "EXPERIENCE_LAYER_MISSING",
    "OPERATOR_WARNING_VIEW_MISSING",
    "CCI_INTEGRATION_MISSING",
    "LOCAL_CCI_DUPLICATION_ATTEMPTED",
    "CAF_INTEGRATION_MISSING",
    "CAF_GATE_SEQUENCE_INVALID",
    "UNDECLARED_AGENT_CAPABILITY",
    "MISSION_CONTROL_INTEGRATION_MISSING",
    "FRAMEWORK_INTERFACE_UNAUTHORIZED",
    "GOVERNANCE_BINDING_MISSING",
    "AUTHORITY_EXPANSION",
    "GOVERNANCE_BYPASS",
    "OPERATOR_BYPASS",
    "POLICY_UNAVAILABLE",
    "EVIDENCE_INDEX_MISSING",
    "MATERIAL_EVIDENCE_MISSING",
    "EVIDENCE_STORAGE_DUPLICATED",
    "REPLAY_ANALYSIS_MISSING",
    "UNEXPLAINED_DIVERGENCE",
    "NONDETERMINISTIC_BEHAVIOR",
    "REPLAY_ENGINE_DUPLICATED",
    "OBSERVABILITY_MISSING",
    "DEPENDENCY_HEALTH_UNOBSERVABLE",
    "SECURITY_MODEL_INVALID",
    "TENANT_ISOLATION_FAILURE",
    "PRIVILEGE_ESCALATION_UNBLOCKED",
    "LIFECYCLE_RECORD_MISSING",
    "ROLLBACK_UNAVAILABLE",
    "CERTIFICATION_FAILED",
    "UNCERTIFIED_DEPENDENCY",
    "SECURITY_FINDING_UNRESOLVED",
    "UNCERTIFIED_ACTIVATION_PATH",
    "PRODUCTION_ACTIVATION_MISSING",
    "RELEASE_ARTIFACT_MISMATCH",
  ] as const)("fails STEVN Application certification for %s", (scenario: StevnScenario) => {
    const result = runStevn({ scenario });
    const validation = validateStevn(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(result.activation.activated).toBe(false);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runStevn({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
