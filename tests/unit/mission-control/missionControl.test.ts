import { describe, expect, it } from "vitest";
import { getMissionControlBundle, replayMissionControl, runMissionControl, validateMissionControl } from "@/services/mission-control";
import type { MissionControlScenario } from "@/types/mission-control";

describe("Program 4 P4.11 Mission Control", () => {
  it("publishes Mission Control doctrine without owning platform governance or shared infrastructure", () => {
    const bundle = getMissionControlBundle();

    expect(bundle.doctrine.version).toBe("mission-control/v4.11");
    expect(bundle.doctrine.owns_mission_control_application).toBe(true);
    expect(bundle.doctrine.owns_mission_management).toBe(true);
    expect(bundle.doctrine.owns_recommendation_presentation).toBe(true);
    expect(bundle.doctrine.owns_operator_workflows).toBe(true);
    expect(bundle.doctrine.owns_application_experience).toBe(true);
    expect(bundle.doctrine.owns_platform_governance).toBe(false);
    expect(bundle.doctrine.owns_authority_enforcement).toBe(false);
    expect(bundle.doctrine.owns_policy_enforcement).toBe(false);
    expect(bundle.doctrine.owns_safety_enforcement).toBe(false);
    expect(bundle.doctrine.executes_replay).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_certification_services).toBe(false);
    expect(bundle.doctrine.owns_identity_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_registry_infrastructure).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("implements deterministic Mission Control workspaces, management, recommendations, visualization, and governance views", () => {
    const first = runMissionControl();
    const second = runMissionControl();

    expect(first.operational_intelligence_ref).toBe("application-observability-operational-intelligence/v4.10");
    expect(first.replay_audit_forensics_ref).toBe("application-replay-audit-forensics/v4.9");
    expect(first.application.application_name).toBe("Mission Control");
    expect(first.application.advisory_only).toBe(true);
    expect(first.mission_workspace.modules).toEqual(["Mission Dashboard", "Mission Timeline", "Mission Context", "Situation Overview", "Mission Navigator"]);
    expect(first.mission_management.lifecycle_state).toBe("ACTIVE");
    expect(first.mission_management.deterministic_lifecycle).toBe(true);
    expect(first.recommendation_center.caf_recommendation_refs.length).toBeGreaterThan(0);
    expect(first.recommendation_center.authorizes_execution).toBe(false);
    expect(first.operator_workspace.functional).toBe(true);
    expect(first.visualization_framework.mission_map_refs.length).toBeGreaterThan(0);
    expect(first.replay_audit_viewer.consumes_p4_9_outputs).toBe(true);
    expect(first.replay_audit_viewer.executes_replay).toBe(false);
    expect(first.governance_workspace.fully_visible).toBe(true);
    expect(first.governance_workspace.enforces_authority).toBe(false);
    expect(first.integrations.all_integrations_certified).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMissionControl(first).valid).toBe(true);
    expect(replayMissionControl(first)).toBe(true);
  });

  it("certifies Mission Control exit criteria and advisory constitutional posture", () => {
    const result = runMissionControl();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.application_implemented).toBe(true);
    expect(result.certification.mission_lifecycle_operational).toBe(true);
    expect(result.certification.strategic_workspaces_available).toBe(true);
    expect(result.certification.operator_workspaces_functional).toBe(true);
    expect(result.certification.recommendations_integrated).toBe(true);
    expect(result.certification.operational_intelligence_integrated).toBe(true);
    expect(result.certification.replay_audit_forensics_integrated).toBe(true);
    expect(result.certification.governance_status_visible).toBe(true);
    expect(result.certification.certified_integrations_only).toBe(true);
    expect(result.certification.constitutionally_advisory).toBe(true);
    expect(result.certification.application_certified).toBe(true);
    expect(result.certification.ecosystem_deployment_ready).toBe(true);
    expect(result.certification.no_platform_authority_ownership).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_10_OPERATIONAL_INTELLIGENCE_INVALID",
    "PROGRAM_1_CAPABILITY_ATLAS_INVALID",
    "PROGRAM_1_CONSTITUTIONAL_REGISTRY_INVALID",
    "PROGRAM_1_SHARED_VOCABULARY_INVALID",
    "PROGRAM_2_CCI_SERVICES_INVALID",
    "PROGRAM_3_CAF_SERVICES_INVALID",
    "CERTIFIED_INTERFACES_INVALID",
    "MISSION_CONTROL_APPLICATION_MISSING",
    "MISSION_WORKSPACE_MISSING",
    "MISSION_DASHBOARD_MISSING",
    "MISSION_TIMELINE_MISSING",
    "MISSION_MANAGEMENT_MISSING",
    "MISSION_LIFECYCLE_NON_DETERMINISTIC",
    "STRATEGIC_WORKSPACE_MISSING",
    "STRATEGIC_INTELLIGENCE_MISSING",
    "RECOMMENDATION_CENTER_MISSING",
    "CAF_RECOMMENDATION_INTEGRATION_MISSING",
    "RECOMMENDATION_AUTHORIZATION_ATTEMPTED",
    "OPERATOR_WORKSPACE_MISSING",
    "APPROVAL_REQUEST_VIEW_MISSING",
    "WARNING_VIEW_MISSING",
    "VISUALIZATION_FRAMEWORK_MISSING",
    "MISSION_VISUALIZATION_MISSING",
    "OPERATIONAL_INTELLIGENCE_INTEGRATION_MISSING",
    "REPLAY_AUDIT_VIEWER_MISSING",
    "P4_9_OUTPUT_CONSUMPTION_MISSING",
    "REPLAY_EXECUTION_ATTEMPTED",
    "GOVERNANCE_WORKSPACE_MISSING",
    "CONSTITUTIONAL_STATUS_NOT_VISIBLE",
    "CONFIGURATION_MISSING",
    "CERTIFIED_INTERFACE_CONTRACTS_MISSING",
    "PLATFORM_GOVERNANCE_ATTEMPTED",
    "AUTHORITY_ENFORCEMENT_ATTEMPTED",
    "POLICY_ENFORCEMENT_ATTEMPTED",
    "SAFETY_ENFORCEMENT_ATTEMPTED",
    "EVIDENCE_STORAGE_ATTEMPTED",
    "CERTIFICATION_OWNERSHIP_ATTEMPTED",
    "IDENTITY_INFRASTRUCTURE_ATTEMPTED",
    "REGISTRY_INFRASTRUCTURE_ATTEMPTED",
    "SHARED_PLATFORM_SERVICE_OWNERSHIP_ATTEMPTED",
    "APPLICATION_CERTIFICATION_FAILED",
    "ECOSYSTEM_DEPLOYMENT_NOT_READY",
  ] as const)("fails Mission Control certification for %s", (scenario: MissionControlScenario) => {
    const result = runMissionControl({ scenario });
    const validation = validateMissionControl(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runMissionControl({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
