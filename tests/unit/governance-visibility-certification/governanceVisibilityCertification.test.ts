import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceVisibilityCertificationObservabilitySurface,
  getGovernanceVisibilityCertificationContract,
  runGovernanceVisibilityCertification,
} from "@/services/governance-visibility-certification";
import type { GovernanceVisibilityCertificationScenario } from "@/types/governance-visibility-certification";

vi.setConfig({ testTimeout: 30000 });

describe("Mission Control Phase 7K.5 Governance Visibility Certification Gate", () => {
  it("defines visibility certification doctrine", () => {
    const contract = getGovernanceVisibilityCertificationContract();

    expect(contract.doctrine.schema_version).toBe("governance-visibility-certification/v7K.5");
    expect(contract.doctrine.principles).toContain("certification-driven");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.stages).toContain("FINAL_VISIBILITY_CERTIFICATION");
  });

  it("certifies baseline Governance Visibility as PASS", () => {
    const report = runGovernanceVisibilityCertification();

    expect(report.phase_version).toBe("7K.5");
    expect(report.certification_state).toBe("PASS");
    expect(report.mandatory_tests_passed).toBe(true);
    expect(report.optional_tests_passed).toBe(true);
    expect(report.production_readiness.deployment_eligible).toBe(true);
    expect(report.production_readiness.governance_approval_status).toBe("APPROVED_FOR_PRODUCTION");
  });

  it("covers dashboard, replay, lineage, integrity, security, and final stages", () => {
    const report = runGovernanceVisibilityCertification();

    expect(report.stages.map((stage) => stage.stage_name)).toEqual([
      "DASHBOARD_CERTIFICATION",
      "REPLAY_CERTIFICATION",
      "LINEAGE_CERTIFICATION",
      "INTEGRITY_CERTIFICATION",
      "SECURITY_CERTIFICATION",
      "FINAL_VISIBILITY_CERTIFICATION",
    ]);
    expect(report.certification_tests.length).toBeGreaterThanOrEqual(20);
    expect(report.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("verifies deterministic rendering across all visibility surfaces", () => {
    const first = runGovernanceVisibilityCertification();
    const second = runGovernanceVisibilityCertification();

    expect(second.report_hash).toBe(first.report_hash);
    expect(first.determinism_verified).toBe(true);
    expect(first.dashboard_hash).toBeTruthy();
    expect(first.replay_viewer_hash).toBeTruthy();
    expect(first.lineage_explorer_hash).toBeTruthy();
    expect(first.integrity_viewer_hash).toBeTruthy();
  }, 90000);

  it("packages certification evidence and readiness", () => {
    const report = runGovernanceVisibilityCertification();

    expect(report.evidence_package.dashboard_snapshot_hash).toBe(report.dashboard_hash);
    expect(report.evidence_package.replay_viewer_hash).toBe(report.replay_viewer_hash);
    expect(report.evidence_package.lineage_explorer_hash).toBe(report.lineage_explorer_hash);
    expect(report.evidence_package.integrity_viewer_hash).toBe(report.integrity_viewer_hash);
    expect(report.evidence_package.evidence_hash).toBeTruthy();
    expect(report.production_readiness.readiness_hash).toBeTruthy();
  });

  it("returns CONDITIONAL_PASS for optional visualization gaps only", () => {
    const report = runGovernanceVisibilityCertification({ scenario: "MINOR_VISUALIZATION_GAP" });

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.mandatory_tests_passed).toBe(true);
    expect(report.optional_tests_passed).toBe(false);
    expect(report.outstanding_findings).toEqual(["MINOR_VISUALIZATION_GAP"]);
    expect(report.production_readiness.governance_approval_status).toBe("LIMITED_CERTIFICATION_MODE");
  });

  it.each([
    "MISSING_DASHBOARD",
    "HIDDEN_RECOMMENDATION",
    "REPLAY_TIMELINE_INCOMPLETE",
    "LINEAGE_BREAK_UNDETECTED",
    "HIDDEN_INTEGRITY_ISSUE",
    "EXECUTION_CAPABILITY_EXPOSED",
    "CROSS_TENANT_VISIBILITY",
    "CONSTITUTIONAL_VISIBILITY_BYPASS",
    "API_RESPONSE_NONDETERMINISTIC",
  ] as readonly GovernanceVisibilityCertificationScenario[])("fails closed for %s", (scenario) => {
    const report = runGovernanceVisibilityCertification({ scenario });

    expect(report.certification_state).toBe("FAIL");
    expect(report.mandatory_tests_passed).toBe(false);
    expect(report.production_readiness.deployment_eligible).toBe(false);
    expect(report.production_readiness.governance_approval_status).toBe("BLOCKED");
    expect(report.outstanding_findings.length).toBeGreaterThan(0);
  });

  it("keeps tenant, mission, operator, read-only, and advisory scope explicit", () => {
    const report = runGovernanceVisibilityCertification({ tenant_id: "tenant_custom", mission_id: "mission_custom", operator_id: "operator_custom" });

    expect(report.tenant_id).toBe("tenant_custom");
    expect(report.mission_id).toBe("mission_custom");
    expect(report.operator_id).toBe("operator_custom");
    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.mutation_allowed).toBe(false);
  });

  it("exposes observability", () => {
    const surface = buildGovernanceVisibilityCertificationObservabilitySurface(runGovernanceVisibilityCertification({ scenario: "HIDDEN_GOVERNANCE_STATE" }));

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.total_tests).toBeGreaterThan(0);
    expect(surface.failed_tests).toBeGreaterThan(0);
    expect(surface.production_eligible).toBe(false);
    expect(surface.outstanding_findings).toContain("OPERATOR_VISIBILITY_INCOMPLETE");
    expect(surface.report_hash).toBeTruthy();
  });
});
