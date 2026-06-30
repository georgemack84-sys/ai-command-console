import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceIntegrityValidationObservabilitySurface,
  getGovernanceIntegrityValidationContract,
  runGovernanceIntegrityValidation,
} from "@/services/governance-integrity-validation";
import type { GovernanceIntegrityValidationDomain, GovernanceIntegrityValidationScenario, GovernanceIntegrityValidationState, GovernanceIntegrityViolation } from "@/types/governance-integrity-validation";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7L.3 Governance Integrity Validation", () => {
  it("defines integrity validation doctrine", () => {
    const contract = getGovernanceIntegrityValidationContract();

    expect(contract.doctrine.schema_version).toBe("governance-integrity-validation/v7L.3");
    expect(contract.doctrine.principles).toContain("immutable-history");
    expect(contract.doctrine.principles).toContain("cryptographic-integrity");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.failure_states).toContain("CORRUPTION_DETECTED");
    expect(contract.doctrine.domains).toContain("HASH_CHAIN");
  });

  it("validates baseline governance history as authentic and immutable", () => {
    const report = runGovernanceIntegrityValidation();

    expect(report.phase_version).toBe("7L.3");
    expect(report.validation_run.overall_result).toBe("PASS");
    expect(report.validation_result.overall_result).toBe("PASS");
    expect(report.validation_result.failure_count).toBe(0);
    expect(report.integrity_checks.every((check) => check.validation_result === "PASS")).toBe(true);
    expect(report.timeline.at(-1)?.state).toBe("VALIDATED");
  });

  it("validates every required integrity domain", () => {
    const report = runGovernanceIntegrityValidation();

    expect(report.integrity_checks.map((check) => check.component)).toEqual(["HASH_CHAIN", "EVIDENCE", "RECOMMENDATION", "POLICY", "REPLAY", "HISTORY", "TENANT", "AUTHORITY"]);
    expect(report.validation_result.hash_chain_result).toBe("PASS");
    expect(report.validation_result.evidence_result).toBe("PASS");
    expect(report.validation_result.recommendation_result).toBe("PASS");
    expect(report.validation_result.policy_result).toBe("PASS");
    expect(report.validation_result.replay_result).toBe("PASS");
    expect(report.validation_result.history_result).toBe("PASS");
  });

  it("is deterministic across repeated validation runs", () => {
    const first = runGovernanceIntegrityValidation();
    const second = runGovernanceIntegrityValidation();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.validation_result.result_hash).toBe(first.validation_result.result_hash);
    expect(second.integrity_checks.map((check) => check.check_hash)).toEqual(first.integrity_checks.map((check) => check.check_hash));
  });

  it("records certification-grade evidence in an append-only truth ledger record", () => {
    const report = runGovernanceIntegrityValidation();

    expect(report.evidence_package.governance_history_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.certification_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.replay_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.integrity_hashes.length).toBeGreaterThan(0);
    expect(report.truth_ledger_record.append_only).toBe(true);
    expect(report.truth_ledger_record.check_hashes).toEqual(report.integrity_checks.map((check) => check.check_hash));
  });

  it.each([
    ["BROKEN_HASH_CHAIN", "HASH_CHAIN", "BROKEN_HASH_CHAIN", "HASH_FAILURE"],
    ["HASH_MISMATCH", "HASH_CHAIN", "HASH_MISMATCH", "HASH_FAILURE"],
    ["MISSING_HASH", "HASH_CHAIN", "MISSING_HASH", "HASH_FAILURE"],
    ["ORPHANED_RECORD", "HASH_CHAIN", "ORPHANED_RECORD", "HASH_FAILURE"],
    ["MISSING_EVIDENCE", "EVIDENCE", "MISSING_EVIDENCE", "EVIDENCE_FAILURE"],
    ["ALTERED_EVIDENCE", "EVIDENCE", "ALTERED_EVIDENCE", "EVIDENCE_FAILURE"],
    ["INVALID_EVIDENCE_REFERENCE", "EVIDENCE", "INVALID_EVIDENCE_REFERENCE", "EVIDENCE_FAILURE"],
    ["RECOMMENDATION_MODIFICATION", "RECOMMENDATION", "RECOMMENDATION_MODIFICATION", "RECOMMENDATION_FAILURE"],
    ["CONFIDENCE_ALTERATION", "RECOMMENDATION", "CONFIDENCE_ALTERATION", "RECOMMENDATION_FAILURE"],
    ["POLICY_MODIFICATION", "POLICY", "POLICY_MODIFICATION", "POLICY_FAILURE"],
    ["POLICY_DELETION", "POLICY", "POLICY_DELETION", "POLICY_FAILURE"],
    ["REPLAY_ALTERATION", "REPLAY", "REPLAY_ALTERATION", "REPLAY_FAILURE"],
    ["REPLAY_EVIDENCE_MISSING", "REPLAY", "REPLAY_EVIDENCE_MISSING", "REPLAY_FAILURE"],
    ["DELETED_HISTORY", "HISTORY", "DELETED_HISTORY", "HISTORY_FAILURE"],
    ["MODIFIED_HISTORY", "HISTORY", "MODIFIED_HISTORY", "HISTORY_FAILURE"],
    ["REORDERED_HISTORY", "HISTORY", "REORDERED_HISTORY", "HISTORY_FAILURE"],
    ["INCOMPLETE_TIMELINE", "HISTORY", "INCOMPLETE_TIMELINE", "HISTORY_FAILURE"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT", "TENANT_ISOLATION_VIOLATION", "CORRUPTION_DETECTED"],
    ["AUTHORITY_BOUNDARY_BYPASS", "AUTHORITY", "AUTHORITY_BOUNDARY_BYPASS", "CORRUPTION_DETECTED"],
    ["HIDDEN_INTEGRITY_STATE", "HISTORY", "HIDDEN_INTEGRITY_STATE", "CORRUPTION_DETECTED"],
  ] as readonly [GovernanceIntegrityValidationScenario, GovernanceIntegrityValidationDomain, GovernanceIntegrityViolation, GovernanceIntegrityValidationState][])("fails closed for %s", (scenario, domain, violation, finalState) => {
    const report = runGovernanceIntegrityValidation({ scenario });
    const failed = report.integrity_checks.find((check) => check.component === domain);

    expect(report.validation_run.overall_result).toBe("FAIL");
    expect(report.validation_result.failure_count).toBeGreaterThan(0);
    expect(report.detected_violations).toContain(violation);
    expect(report.timeline.at(-1)?.state).toBe(finalState);
    expect(failed?.validation_result).toBe("FAIL");
    expect(failed?.actual_hash).not.toBe(failed?.expected_hash);
  });

  it("keeps integrity validation read-only, advisory-only, and tenant isolated", () => {
    const report = runGovernanceIntegrityValidation();

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.governance_history_mutation_allowed).toBe(false);
    expect(report.certification_evidence_mutation_allowed).toBe(false);
    expect(report.governance_execution_allowed).toBe(false);
    expect(report.tenant_isolated).toBe(true);
    expect(report.authority_protected).toBe(true);
  });

  it("exposes observability for integrity failures", () => {
    const surface = buildGovernanceIntegrityValidationObservabilitySurface({ scenario: "REPLAY_ALTERATION" });

    expect(surface.overall_result).toBe("FAIL");
    expect(surface.validation_state).toBe("REPLAY_FAILURE");
    expect(surface.check_count).toBeGreaterThan(0);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.detected_violations).toContain("REPLAY_ALTERATION");
    expect(surface.validation_success_rate).toBe(0);
    expect(surface.report_hash).toBeTruthy();
  });
});
