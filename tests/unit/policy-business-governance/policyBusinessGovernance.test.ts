import { describe, expect, it } from "vitest";
import {
  getPolicyBusinessGovernanceBundle,
  replayPolicyBusinessGovernance,
  runPolicyBusinessGovernance,
  validatePolicyBusinessGovernance,
} from "@/services/policy-business-governance";
import type { PbgScenario } from "@/types/policy-business-governance";

describe("Program 4 P4.13 Policy and Business Governance", () => {
  it("publishes PBG doctrine without owning constitutional governance or enforcement infrastructure", () => {
    const bundle = getPolicyBusinessGovernanceBundle();

    expect(bundle.doctrine.version).toBe("policy-business-governance/v4.13");
    expect(bundle.doctrine.owns_business_policy_management).toBe(true);
    expect(bundle.doctrine.owns_governance_workflow_management).toBe(true);
    expect(bundle.doctrine.owns_organizational_approval_processes).toBe(true);
    expect(bundle.doctrine.owns_policy_lifecycle_management).toBe(true);
    expect(bundle.doctrine.owns_governance_reporting).toBe(true);
    expect(bundle.doctrine.owns_constitutional_governance).toBe(false);
    expect(bundle.doctrine.owns_authority_gate).toBe(false);
    expect(bundle.doctrine.owns_policy_gate).toBe(false);
    expect(bundle.doctrine.owns_safety_gate).toBe(false);
    expect(bundle.doctrine.owns_policy_enforcement).toBe(false);
    expect(bundle.doctrine.owns_replay_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_identity_infrastructure).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic policy lifecycle, governance workflows, catalog, notifications, and reporting", () => {
    const first = runPolicyBusinessGovernance();
    const second = runPolicyBusinessGovernance();

    expect(first.qci_ref).toBe("quantedge-compintel/v4.12");
    expect(first.mission_control_ref).toBe("mission-control/v4.11");
    expect(first.foundation.application_name).toBe("Policy & Business Governance");
    expect(first.foundation.boundaries_verified).toBe(true);
    expect(first.organization.operational).toBe(true);
    expect(first.lifecycle.lifecycle_states).toEqual(["DRAFT", "REVIEW", "PUBLISHED", "RETIRED", "SUPERSEDED"]);
    expect(first.lifecycle.deterministic).toBe(true);
    expect(first.rules.constitutional_separation_maintained).toBe(true);
    expect(first.workflows.routing_deterministic).toBe(true);
    expect(first.workflows.approvals_tracked).toBe(true);
    expect(first.organizational_governance.evidence_refs.length).toBeGreaterThan(0);
    expect(first.catalog.complete).toBe(true);
    expect(first.notifications.delivery_tracked).toBe(true);
    expect(first.reporting.complete).toBe(true);
    expect(first.integration.validated).toBe(true);
    expect(first.readiness.evidence_accepted).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePolicyBusinessGovernance(first).valid).toBe(true);
    expect(replayPolicyBusinessGovernance(first)).toBe(true);
  });

  it("certifies PBG production readiness and constitutional separation", () => {
    const result = runPolicyBusinessGovernance();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.constitutionally_compliant).toBe(true);
    expect(result.certification.organizational_governance_operational).toBe(true);
    expect(result.certification.policy_lifecycle_operational).toBe(true);
    expect(result.certification.business_rules_managed).toBe(true);
    expect(result.certification.workflows_deterministic).toBe(true);
    expect(result.certification.approvals_tracked).toBe(true);
    expect(result.certification.governance_reporting_complete).toBe(true);
    expect(result.certification.integrations_validated).toBe(true);
    expect(result.certification.evidence_lineage_complete).toBe(true);
    expect(result.certification.replay_compatible).toBe(true);
    expect(result.certification.operationally_ready).toBe(true);
    expect(result.certification.production_deployment_ready).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_12_QCI_INVALID",
    "P4_11_MISSION_CONTROL_INVALID",
    "PROGRAM_1_GOVERNANCE_INVALID",
    "PROGRAM_2_CCI_SERVICES_INVALID",
    "PROGRAM_3_CAF_GATES_INVALID",
    "PBG_APPLICATION_MISSING",
    "APPLICATION_FOUNDATION_MISSING",
    "GOVERNANCE_DOMAIN_MODEL_MISSING",
    "SERVICE_ARCHITECTURE_MISSING",
    "APPLICATION_CONFIGURATION_MISSING",
    "ORGANIZATION_REGISTRY_MISSING",
    "GOVERNANCE_HIERARCHY_MISSING",
    "OWNERSHIP_LINEAGE_INCOMPLETE",
    "POLICY_REGISTRY_MISSING",
    "POLICY_LIFECYCLE_NON_DETERMINISTIC",
    "POLICY_VERSION_LINEAGE_INCOMPLETE",
    "BUSINESS_RULE_REGISTRY_MISSING",
    "POLICY_CATALOG_MISSING",
    "RULE_LIBRARY_MISSING",
    "CONSTITUTIONAL_SEPARATION_VIOLATED",
    "WORKFLOW_ENGINE_MISSING",
    "APPROVAL_ROUTING_NON_DETERMINISTIC",
    "APPROVAL_PIPELINE_MISSING",
    "DECISION_HISTORY_MISSING",
    "ORGANIZATIONAL_GOVERNANCE_MISSING",
    "GOVERNANCE_EVIDENCE_INCOMPLETE",
    "POLICY_DISCOVERY_MISSING",
    "POLICY_INDEX_INCOMPLETE",
    "NOTIFICATION_SERVICE_MISSING",
    "DELIVERY_TRACKING_MISSING",
    "GOVERNANCE_DASHBOARD_MISSING",
    "REPORTING_INCOMPLETE",
    "INTEGRATION_CONTRACTS_INVALID",
    "INTEROPERABILITY_INVALID",
    "OBSERVABILITY_DIAGNOSTICS_MISSING",
    "WORKFLOW_MONITORING_MISSING",
    "READINESS_ASSESSMENT_MISSING",
    "CERTIFICATION_EVIDENCE_MISSING",
    "VALIDATION_REPORTS_MISSING",
    "CONSUMER_READINESS_MISSING",
    "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED",
    "AUTHORITY_GATE_OWNERSHIP_ATTEMPTED",
    "POLICY_GATE_OWNERSHIP_ATTEMPTED",
    "SAFETY_GATE_OWNERSHIP_ATTEMPTED",
    "POLICY_ENFORCEMENT_ATTEMPTED",
    "REPLAY_INFRASTRUCTURE_ATTEMPTED",
    "EVIDENCE_STORAGE_ATTEMPTED",
    "IDENTITY_INFRASTRUCTURE_ATTEMPTED",
    "PRODUCTION_DEPLOYMENT_NOT_READY",
  ] as const)("fails PBG certification for %s", (scenario: PbgScenario) => {
    const result = runPolicyBusinessGovernance({ scenario });
    const validation = validatePolicyBusinessGovernance(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runPolicyBusinessGovernance({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
