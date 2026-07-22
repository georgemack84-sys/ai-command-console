import { describe, expect, it } from "vitest";
import { getApexBundle, replayApex, runApex, validateApex } from "@/services/apex";
import type { ApexScenario } from "@/types/apex";

describe("Program 4 P4.16 APEX", () => {
  it("publishes APEX doctrine without owning shared infrastructure or enforcement engines", () => {
    const bundle = getApexBundle();

    expect(bundle.doctrine.version).toBe("apex/v4.16");
    expect(bundle.doctrine.owns_planning_workflows).toBe(true);
    expect(bundle.doctrine.owns_execution_orchestration).toBe(true);
    expect(bundle.doctrine.owns_operational_coordination).toBe(true);
    expect(bundle.doctrine.owns_workflow_management).toBe(true);
    expect(bundle.doctrine.owns_operational_dashboards).toBe(true);
    expect(bundle.doctrine.owns_identity).toBe(false);
    expect(bundle.doctrine.owns_governance_engines).toBe(false);
    expect(bundle.doctrine.owns_authority_enforcement).toBe(false);
    expect(bundle.doctrine.owns_policy_enforcement).toBe(false);
    expect(bundle.doctrine.owns_safety_enforcement).toBe(false);
    expect(bundle.doctrine.owns_replay_engine).toBe(false);
    expect(bundle.doctrine.owns_audit_engine).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_certification_engine).toBe(false);
    expect(bundle.doctrine.owns_messaging_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_observability_platform).toBe(false);
    expect(bundle.doctrine.owns_registry_infrastructure).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic planning, workflow, execution, collaboration, governance, evidence, replay, and qualification records", () => {
    const first = runApex();
    const second = runApex();

    expect(first.aurora_ref).toBe("aurora/v4.15");
    expect(first.publisher_os_ref).toBe("publisher-os/v4.14");
    expect(first.foundation.application_name).toBe("APEX");
    expect(first.planning_engine.operational).toBe(true);
    expect(first.workflow_orchestration.operational).toBe(true);
    expect(first.execution_coordination.operational).toBe(true);
    expect(first.dashboards.operational).toBe(true);
    expect(first.collaboration.refs).toContain("caf-collaboration");
    expect(first.governance.authority_gate_ref).toBe("caf:authority-gate");
    expect(first.governance.enforcement_owned).toBe(false);
    expect(first.evidence.workflow_evidence_refs.length).toBeGreaterThan(0);
    expect(first.replay.consumes_caf_behavioral_replay).toBe(true);
    expect(first.replay.executes_replay).toBe(false);
    expect(first.security.tenant_isolation_validated).toBe(true);
    expect(first.qualification.qualified).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApex(first).valid).toBe(true);
    expect(replayApex(first)).toBe(true);
  });

  it("certifies APEX application qualification criteria", () => {
    const result = runApex();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.foundation_complete).toBe(true);
    expect(result.certification.planning_operational).toBe(true);
    expect(result.certification.workflow_orchestration_operational).toBe(true);
    expect(result.certification.execution_coordination_operational).toBe(true);
    expect(result.certification.dashboards_operational).toBe(true);
    expect(result.certification.collaboration_supported).toBe(true);
    expect(result.certification.governance_integrated).toBe(true);
    expect(result.certification.evidence_complete).toBe(true);
    expect(result.certification.replay_supported).toBe(true);
    expect(result.certification.observability_operational).toBe(true);
    expect(result.certification.lifecycle_certification_supported).toBe(true);
    expect(result.certification.tenant_isolation_validated).toBe(true);
    expect(result.certification.performance_scalability_validated).toBe(true);
    expect(result.certification.integrations_validated).toBe(true);
    expect(result.certification.production_ready).toBe(true);
    expect(result.certification.application_qualified).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_15_AURORA_INVALID",
    "P4_14_PUBLISHER_OS_INVALID",
    "P4_13_PBG_INVALID",
    "PROGRAM_1_FOUNDATION_INVALID",
    "PROGRAM_2_CCI_INVALID",
    "PROGRAM_3_CAF_INVALID",
    "APEX_APPLICATION_MISSING",
    "APPLICATION_FOUNDATION_MISSING",
    "APPLICATION_CONSTITUTION_MISSING",
    "PLANNING_MODEL_MISSING",
    "EXECUTION_MODEL_MISSING",
    "PLANNING_ENGINE_MISSING",
    "MISSION_PLANNING_MISSING",
    "DEPENDENCY_PLANNING_MISSING",
    "SCHEDULING_MISSING",
    "OBJECTIVE_DECOMPOSITION_MISSING",
    "WORKFLOW_ENGINE_MISSING",
    "STAGE_PROGRESSION_INVALID",
    "DEPENDENCY_COORDINATION_INVALID",
    "EXECUTION_COORDINATOR_MISSING",
    "EXECUTION_STATE_INVALID",
    "EXECUTION_MONITORING_MISSING",
    "OPERATIONAL_DASHBOARD_MISSING",
    "WORKFLOW_VISUALIZATION_MISSING",
    "PROGRESS_MONITORING_MISSING",
    "COLLABORATION_WORKSPACE_MISSING",
    "CAF_COLLABORATION_INVALID",
    "APPROVAL_COLLABORATION_MISSING",
    "GOVERNANCE_INTEGRATION_MISSING",
    "AUTHORITY_GATE_NOT_BOUND",
    "POLICY_GATE_NOT_BOUND",
    "SAFETY_GATE_NOT_BOUND",
    "APPROVAL_ROUTING_MISSING",
    "EVIDENCE_INTEGRATION_MISSING",
    "WORKFLOW_EVIDENCE_MISSING",
    "PLANNING_EVIDENCE_INDEX_MISSING",
    "REPLAY_INTEGRATION_MISSING",
    "BEHAVIORAL_REPLAY_NOT_CONSUMED",
    "OBSERVABILITY_MISSING",
    "DIAGNOSTICS_MISSING",
    "LIFECYCLE_RECORDS_MISSING",
    "CERTIFICATION_RECORDS_MISSING",
    "TENANT_ISOLATION_INVALID",
    "SECURITY_BOUNDARIES_INVALID",
    "PERFORMANCE_REPORT_MISSING",
    "SCALABILITY_INVALID",
    "INTEGRATION_REPORT_MISSING",
    "INTEROPERABILITY_INVALID",
    "PRODUCTION_READINESS_MISSING",
    "QUALIFICATION_FAILED",
    "IDENTITY_OWNERSHIP_ATTEMPTED",
    "GOVERNANCE_ENGINE_ATTEMPTED",
    "AUTHORITY_ENFORCEMENT_ATTEMPTED",
    "POLICY_ENFORCEMENT_ATTEMPTED",
    "SAFETY_ENFORCEMENT_ATTEMPTED",
    "REPLAY_ENGINE_ATTEMPTED",
    "AUDIT_ENGINE_ATTEMPTED",
    "EVIDENCE_STORAGE_ATTEMPTED",
    "CERTIFICATION_ENGINE_ATTEMPTED",
    "MESSAGING_INFRASTRUCTURE_ATTEMPTED",
    "OBSERVABILITY_PLATFORM_ATTEMPTED",
    "REGISTRY_INFRASTRUCTURE_ATTEMPTED",
  ] as const)("fails APEX certification for %s", (scenario: ApexScenario) => {
    const result = runApex({ scenario });
    const validation = validateApex(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApex({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
