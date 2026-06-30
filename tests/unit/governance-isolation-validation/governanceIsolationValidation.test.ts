import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceIsolationObservabilitySurface,
  getGovernanceIsolationValidationContract,
  runGovernanceIsolationValidation,
} from "@/services/governance-isolation-validation";
import type { GovernanceIsolationDomain, GovernanceIsolationScenario, GovernanceIsolationValidationState, GovernanceIsolationViolation } from "@/types/governance-isolation-validation";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7L.5 Isolation Validation", () => {
  it("defines isolation validation doctrine", () => {
    const contract = getGovernanceIsolationValidationContract();

    expect(contract.doctrine.schema_version).toBe("governance-isolation-validation/v7L.5");
    expect(contract.doctrine.principles).toContain("tenant-isolation");
    expect(contract.doctrine.principles).toContain("governance-separation");
    expect(contract.doctrine.principles).toContain("evidence-isolation");
    expect(contract.doctrine.failure_states).toContain("CROSS_TENANT_ACCESS_DETECTED");
    expect(contract.doctrine.domains).toContain("TENANT_BOUNDARY");
  });

  it("validates baseline governance intelligence as tenant isolated", () => {
    const report = runGovernanceIsolationValidation();

    expect(report.phase_version).toBe("7L.5");
    expect(report.validation_run.overall_result).toBe("PASS");
    expect(report.validation_result.overall_result).toBe("PASS");
    expect(report.validation_result.failure_count).toBe(0);
    expect(report.isolation_checks.every((check) => check.validation_result === "PASS")).toBe(true);
    expect(report.timeline.at(-1)?.state).toBe("VALIDATED");
  });

  it("validates every isolation domain", () => {
    const report = runGovernanceIsolationValidation();

    expect(report.isolation_checks.map((check) => check.component)).toEqual(["TENANT_BOUNDARY", "GOVERNANCE_SEPARATION", "REPLAY_ISOLATION", "RECOMMENDATION_ISOLATION", "EVIDENCE_ISOLATION", "VISIBILITY_CONTROL"]);
    expect(report.validation_result.tenant_boundary_result).toBe("PASS");
    expect(report.validation_result.governance_result).toBe("PASS");
    expect(report.validation_result.replay_result).toBe("PASS");
    expect(report.validation_result.recommendation_result).toBe("PASS");
    expect(report.validation_result.evidence_result).toBe("PASS");
    expect(report.validation_result.visibility_result).toBe("PASS");
  });

  it("is deterministic across repeated isolation validations", () => {
    const first = runGovernanceIsolationValidation();
    const second = runGovernanceIsolationValidation();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.validation_result.result_hash).toBe(first.validation_result.result_hash);
    expect(second.isolation_checks.map((check) => check.check_hash)).toEqual(first.isolation_checks.map((check) => check.check_hash));
  });

  it("stores isolation evidence in an append-only truth ledger record", () => {
    const report = runGovernanceIsolationValidation();

    expect(report.evidence_package.tenant_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.governance_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.replay_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.evidence_refs.length).toBeGreaterThan(0);
    expect(report.truth_ledger_record.append_only).toBe(true);
    expect(report.truth_ledger_record.check_hashes).toEqual(report.isolation_checks.map((check) => check.check_hash));
  });

  it.each([
    ["TENANT_MISMATCH", "TENANT_BOUNDARY", "TENANT_MISMATCH", "TENANT_BOUNDARY_FAILURE"],
    ["CROSS_TENANT_RECORD_REFERENCE", "TENANT_BOUNDARY", "CROSS_TENANT_RECORD_REFERENCE", "CROSS_TENANT_ACCESS_DETECTED"],
    ["UNAUTHORIZED_TENANT_ACCESS", "TENANT_BOUNDARY", "UNAUTHORIZED_TENANT_ACCESS", "CROSS_TENANT_ACCESS_DETECTED"],
    ["SHARED_GOVERNANCE_STATE", "GOVERNANCE_SEPARATION", "SHARED_GOVERNANCE_STATE", "GOVERNANCE_ISOLATION_FAILURE"],
    ["POLICY_CONTAMINATION", "GOVERNANCE_SEPARATION", "POLICY_CONTAMINATION", "GOVERNANCE_ISOLATION_FAILURE"],
    ["GOVERNANCE_STATE_LEAKAGE", "GOVERNANCE_SEPARATION", "GOVERNANCE_STATE_LEAKAGE", "GOVERNANCE_ISOLATION_FAILURE"],
    ["REPLAY_DATA_LEAKAGE", "REPLAY_ISOLATION", "REPLAY_DATA_LEAKAGE", "REPLAY_ISOLATION_FAILURE"],
    ["CROSS_TENANT_REPLAY_RECONSTRUCTION", "REPLAY_ISOLATION", "CROSS_TENANT_REPLAY_RECONSTRUCTION", "CROSS_TENANT_ACCESS_DETECTED"],
    ["SHARED_REPLAY_HISTORY", "REPLAY_ISOLATION", "SHARED_REPLAY_HISTORY", "REPLAY_ISOLATION_FAILURE"],
    ["SHARED_RECOMMENDATIONS", "RECOMMENDATION_ISOLATION", "SHARED_RECOMMENDATIONS", "RECOMMENDATION_ISOLATION_FAILURE"],
    ["RECOMMENDATION_VISIBILITY_LEAK", "RECOMMENDATION_ISOLATION", "RECOMMENDATION_VISIBILITY_LEAK", "RECOMMENDATION_ISOLATION_FAILURE"],
    ["RECOMMENDATION_OWNERSHIP_MISMATCH", "RECOMMENDATION_ISOLATION", "RECOMMENDATION_OWNERSHIP_MISMATCH", "RECOMMENDATION_ISOLATION_FAILURE"],
    ["SHARED_EVIDENCE", "EVIDENCE_ISOLATION", "SHARED_EVIDENCE", "EVIDENCE_ISOLATION_FAILURE"],
    ["UNAUTHORIZED_EVIDENCE_REFERENCE", "EVIDENCE_ISOLATION", "UNAUTHORIZED_EVIDENCE_REFERENCE", "EVIDENCE_ISOLATION_FAILURE"],
    ["EVIDENCE_LEAKAGE", "EVIDENCE_ISOLATION", "EVIDENCE_LEAKAGE", "EVIDENCE_ISOLATION_FAILURE"],
    ["UNAUTHORIZED_DASHBOARD_VISIBILITY", "VISIBILITY_CONTROL", "UNAUTHORIZED_DASHBOARD_VISIBILITY", "VISIBILITY_FAILURE"],
    ["UNAUTHORIZED_SEARCH_RESULT", "VISIBILITY_CONTROL", "UNAUTHORIZED_SEARCH_RESULT", "VISIBILITY_FAILURE"],
    ["UNAUTHORIZED_LINEAGE_VIEW", "VISIBILITY_CONTROL", "UNAUTHORIZED_LINEAGE_VIEW", "VISIBILITY_FAILURE"],
    ["UNAUTHORIZED_RECOMMENDATION_VISIBILITY", "VISIBILITY_CONTROL", "UNAUTHORIZED_RECOMMENDATION_VISIBILITY", "VISIBILITY_FAILURE"],
    ["UNAUTHORIZED_EVIDENCE_INSPECTION", "VISIBILITY_CONTROL", "UNAUTHORIZED_EVIDENCE_INSPECTION", "VISIBILITY_FAILURE"],
  ] as readonly [GovernanceIsolationScenario, GovernanceIsolationDomain, GovernanceIsolationViolation, GovernanceIsolationValidationState][])("rejects %s", (scenario, domain, violation, finalState) => {
    const report = runGovernanceIsolationValidation({ scenario });
    const failed = report.isolation_checks.find((check) => check.component === domain);

    expect(report.validation_run.overall_result).toBe("FAIL");
    expect(report.validation_result.failure_count).toBeGreaterThan(0);
    expect(report.rejected_violations).toContain(violation);
    expect(report.timeline.at(-1)?.state).toBe(finalState);
    expect(failed?.validation_result).toBe("FAIL");
    expect(failed?.violation_type).toBe(violation);
    expect(failed?.observed_scope).not.toBe(failed?.expected_scope);
  });

  it("keeps isolation validation read-only and unable to expose or mutate tenant data", () => {
    const report = runGovernanceIsolationValidation();

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.tenant_data_mutation_allowed).toBe(false);
    expect(report.ownership_mutation_allowed).toBe(false);
    expect(report.authorization_bypass_allowed).toBe(false);
    expect(report.protected_information_exposure_allowed).toBe(false);
    expect(report.governance_execution_allowed).toBe(false);
    expect(report.tenant_isolated).toBe(true);
    expect(report.authority_protected).toBe(true);
  });

  it("exposes isolation observability for unauthorized visibility", () => {
    const surface = buildGovernanceIsolationObservabilitySurface({ scenario: "UNAUTHORIZED_DASHBOARD_VISIBILITY" });

    expect(surface.overall_result).toBe("FAIL");
    expect(surface.validation_state).toBe("VISIBILITY_FAILURE");
    expect(surface.check_count).toBeGreaterThan(0);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.rejected_violations).toContain("UNAUTHORIZED_DASHBOARD_VISIBILITY");
    expect(surface.unauthorized_visibility_detections).toBe(1);
    expect(surface.report_hash).toBeTruthy();
  });
});
