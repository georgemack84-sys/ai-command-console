import { describe, expect, it } from "vitest";
import {
  buildExecutionAssuranceCertificationVisibilitySurface,
  getExecutionAssuranceCertificationGateContract,
  runExecutionAssuranceCertificationGate,
} from "@/services/execution-assurance-certification-gate";
import type { ExecutionAssuranceCertificationFailure, ExecutionAssuranceCertificationScenario, ExecutionAssuranceCertificationState } from "@/types/execution-assurance-certification-gate";

describe("Mission Control Phase 8E.5 Execution Assurance Certification Gate", () => {
  it("publishes certification doctrine and validation areas", () => {
    const contract = getExecutionAssuranceCertificationGateContract();

    expect(contract.doctrine.schema_version).toBe("execution-assurance-certification-gate/v8E.5");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.principles).toContain("runtime-assurance-certified");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.validation_areas).toContain("CERTIFICATION_SUITE");
  });

  it("certifies the baseline Execution Assurance Intelligence stack", () => {
    const report = runExecutionAssuranceCertificationGate();

    expect(report.phase_version).toBe("8E.5");
    expect(report.certification_result.overall_state).toBe("PASS");
    expect(report.controlled_autonomy_progression_allowed).toBe(true);
    expect(report.certification_result.production_decision).toBe("CERTIFIED_FOR_CONTROLLED_AUTONOMY");
    expect(report.certification_checks.every((check) => check.passed)).toBe(true);
    expect(report.governance_enforced).toBe(true);
    expect(report.operator_supremacy_preserved).toBe(true);
  });

  it("covers the full Execution Assurance certification matrix", () => {
    const report = runExecutionAssuranceCertificationGate();
    const areas = new Set(report.certification_checks.map((check) => check.area));

    expect(areas).toEqual(new Set(["CONTRACT", "RUNTIME", "GOVERNANCE", "RECOVERY", "DECISION", "HEALTH", "CONFIDENCE", "MONITORING", "EVIDENCE", "REPLAY", "LINEAGE", "INTEGRITY", "SECURITY", "CERTIFICATION_SUITE"]));
    expect(report.certification_checks.length).toBeGreaterThanOrEqual(37);
  });

  it("records immutable evidence, replay validation, and append-only decision ledger", () => {
    const report = runExecutionAssuranceCertificationGate();

    expect(report.certification_evidence.contract_assurance_id).toBe(report.source_execution_record.assurance_id);
    expect(report.certification_evidence.runtime_package_id).toBe(report.source_runtime_package.package_id);
    expect(report.certification_evidence.governance_package_id).toBe(report.source_governance_package.package_id);
    expect(report.certification_evidence.recovery_package_id).toBe(report.source_recovery_package.package_id);
    expect(report.replay_validation_report.reconstructed_decision).toBe("PASS");
    expect(report.decision_ledger_entry.append_only).toBe(true);
    expect(report.decision_ledger_entry.evidence_hash).toBe(report.certification_evidence.evidence_hash);
    expect(report.decision_ledger_entry.check_hashes).toEqual(report.certification_checks.map((check) => check.check_hash));
  });

  it("is deterministic across repeated certification runs", () => {
    const first = runExecutionAssuranceCertificationGate();
    const second = runExecutionAssuranceCertificationGate();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.certification_result.result_hash).toBe(first.certification_result.result_hash);
    expect(second.certification_evidence.evidence_hash).toBe(first.certification_evidence.evidence_hash);
    expect(second.certification_checks.map((check) => check.check_hash)).toEqual(first.certification_checks.map((check) => check.check_hash));
  });

  it("allows conditional pass only for non-critical reporting gaps", () => {
    const report = runExecutionAssuranceCertificationGate({ scenario: "MINOR_REPORTING_GAP" });

    expect(report.certification_result.overall_state).toBe("CONDITIONAL_PASS");
    expect(report.certification_result.warning_count).toBe(1);
    expect(report.certification_result.critical_failure_count).toBe(0);
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
    expect(report.certification_result.production_decision).toBe("CONDITIONAL_REMEDIATION_REQUIRED");
  });

  it.each([
    ["EXECUTION_ASSURANCE_CONTRACT_INVALID", "FAIL"],
    ["RUNTIME_ASSURANCE_NOT_OPERATIONAL", "FAIL"],
    ["GOVERNANCE_ASSURANCE_NOT_OPERATIONAL", "FAIL"],
    ["RECOVERY_INTELLIGENCE_NOT_OPERATIONAL", "FAIL"],
    ["EXECUTION_HEALTH_SCORING_NONDETERMINISTIC", "FAIL"],
    ["CONFIDENCE_SCORING_NONDETERMINISTIC", "FAIL"],
    ["ASSURANCE_DECISION_NONDETERMINISTIC", "FAIL"],
    ["CONSTITUTIONAL_VERIFICATION_NOT_ENFORCED", "FAIL"],
    ["AUTHORITY_VALIDATION_NOT_ENFORCED", "FAIL"],
    ["POLICY_COMPLIANCE_NOT_ENFORCED", "FAIL"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "FAIL"],
    ["INTEGRITY_HASH_NOT_REPRODUCIBLE", "FAIL"],
    ["OPERATOR_SUPREMACY_NOT_PRESERVED", "FAIL"],
    ["TENANT_ISOLATION_NOT_ENFORCED", "FAIL"],
    ["HIDDEN_EXECUTION_DETECTED", "FAIL"],
    ["GOVERNANCE_BYPASS_DETECTED", "FAIL"],
    ["CONSTITUTIONAL_VIOLATION_PERMITTED", "FAIL"],
    ["AUTHORITY_ESCALATION_PERMITTED", "FAIL"],
    ["POLICY_BYPASS_PERMITTED", "FAIL"],
    ["CROSS_TENANT_ACCESS_PERMITTED", "FAIL"],
  ] as readonly [ExecutionAssuranceCertificationScenario, ExecutionAssuranceCertificationState][])("blocks certification for %s", (scenario, state) => {
    const report = runExecutionAssuranceCertificationGate({ scenario });
    const failed = report.certification_checks.find((check) => check.failure_reason === scenario as ExecutionAssuranceCertificationFailure);

    expect(report.certification_result.overall_state).toBe(state);
    expect(report.certification_result.critical_failure_count).toBeGreaterThan(0);
    expect(report.certification_result.blocking_failures).toContain(scenario as ExecutionAssuranceCertificationFailure);
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
    expect(report.certification_result.production_decision).toBe("BLOCKED_FROM_CONTROLLED_AUTONOMY");
    expect(failed?.passed).toBe(false);
  });

  it("keeps the gate read-only, advisory-only, and fail-closed", () => {
    const report = runExecutionAssuranceCertificationGate({ scenario: "INTEGRITY_VERIFICATION_FAILURE_IGNORED" });

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.certification_result.overall_state).toBe("FAIL");
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
    expect(report.integrity_protected).toBe(false);
  });

  it("exposes certification visibility", () => {
    const surface = buildExecutionAssuranceCertificationVisibilitySurface({ scenario: "NONDETERMINISTIC_ASSURANCE_DECISION" });

    expect(surface.overall_state).toBe("FAIL");
    expect(surface.controlled_autonomy_progression_allowed).toBe(false);
    expect(surface.blocking_failures).toContain("NONDETERMINISTIC_ASSURANCE_DECISION");
    expect(surface.report_hash).toBeTruthy();
  });
});
