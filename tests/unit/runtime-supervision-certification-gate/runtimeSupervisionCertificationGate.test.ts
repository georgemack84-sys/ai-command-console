import { describe, expect, it } from "vitest";
import {
  buildRuntimeSupervisionCertificationVisibilitySurface,
  getRuntimeSupervisionCertificationGateContract,
  runRuntimeSupervisionCertificationGate,
} from "@/services/runtime-supervision-certification-gate";
import type {
  RuntimeSupervisionCertificationFailure,
  RuntimeSupervisionCertificationScenario,
} from "@/types/runtime-supervision-certification-gate";

describe("Mission Control Phase 8E.E Runtime Supervision Certification Gate", () => {
  it("publishes runtime supervision certification doctrine and validation areas", () => {
    const contract = getRuntimeSupervisionCertificationGateContract();

    expect(contract.doctrine.schema_version).toBe("runtime-supervision-certification-gate/v8E.E");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.principles).toContain("operator-supremacy");
    expect(contract.doctrine.principles).toContain("advisory-only-authority");
    expect(contract.doctrine.lifecycle_states).toEqual(["INITIALIZING", "VALIDATING", "CERTIFYING", "PASS", "CONDITIONAL_PASS", "FAIL", "ARCHIVED"]);
    expect(contract.doctrine.decision_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.validation_areas).toContain("CERTIFICATION_SUITE");
  });

  it("certifies the baseline Runtime Supervision stack", () => {
    const report = runRuntimeSupervisionCertificationGate();

    expect(report.phase).toBe("8E.E");
    expect(report.certification_state).toBe("PASS");
    expect(report.certification_result.overall_decision).toBe("PASS");
    expect(report.controlled_autonomy_progression_allowed).toBe(true);
    expect(report.certification_result.progression_decision).toBe("CERTIFIED_FOR_NEXT_EXECUTION_PHASE");
    expect(report.certification_checks.every((check) => check.passed)).toBe(true);
    expect(report.deterministic).toBe(true);
    expect(report.replayable).toBe(true);
    expect(report.explainable).toBe(true);
    expect(report.operator_supremacy_preserved).toBe(true);
    expect(report.authority_enforced).toBe(true);
  });

  it("covers the full Runtime Supervision certification matrix", () => {
    const report = runRuntimeSupervisionCertificationGate();
    const areas = new Set(report.certification_checks.map((check) => check.area));

    expect(areas).toEqual(new Set(["CONTRACT", "FUNCTIONAL", "MONITORING", "RECOMMENDATION", "REPLAY", "GOVERNANCE", "AUTHORITY", "EVIDENCE", "INTEGRITY", "SECURITY", "CERTIFICATION_SUITE"]));
    expect(report.certification_checks.length).toBeGreaterThanOrEqual(30);
    expect(report.tests_passed).toBe(report.certification_checks.length);
    expect(report.tests_failed).toBe(0);
  });

  it("records immutable evidence, replay certification, and append-only decision ledger", () => {
    const report = runRuntimeSupervisionCertificationGate();

    expect(report.certification_evidence.supervision_id).toBe(report.source_supervision_contract.supervision_id);
    expect(report.certification_evidence.observation_package_id).toBe(report.source_observation_package.package_id);
    expect(report.certification_evidence.drift_health_package_id).toBe(report.source_drift_health_package.package_id);
    expect(report.certification_evidence.recommendation_package_id).toBe(report.source_recommendation_package.package_id);
    expect(report.certification_evidence.truth_ledger_references.length).toBeGreaterThan(0);
    expect(report.replay_certification.reconstructed_pipeline).toEqual(["Certification Started", "Contract Validation", "Functional Validation", "Monitoring Validation", "Recommendation Validation", "Replay Validation", "Governance Validation", "Authority Validation", "Evidence Validation", "Final Certification Decision"]);
    expect(report.replay_certification.reconstructed_decision).toBe("PASS");
    expect(report.decision_ledger_entry.append_only).toBe(true);
    expect(report.decision_ledger_entry.evidence_hash).toBe(report.certification_evidence.evidence_hash);
    expect(report.decision_ledger_entry.check_hashes).toEqual(report.certification_checks.map((check) => check.check_hash));
  });

  it("is deterministic across repeated certification runs", () => {
    const first = runRuntimeSupervisionCertificationGate();
    const second = runRuntimeSupervisionCertificationGate();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.certification_result.result_hash).toBe(first.certification_result.result_hash);
    expect(second.certification_evidence.evidence_hash).toBe(first.certification_evidence.evidence_hash);
    expect(second.certification_checks.map((check) => check.check_hash)).toEqual(first.certification_checks.map((check) => check.check_hash));
  });

  it("allows conditional pass only for minor non-functional gaps", () => {
    const report = runRuntimeSupervisionCertificationGate({ scenario: "MINOR_REPORTING_GAP" });

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.certification_result.warning_count).toBe(1);
    expect(report.certification_result.critical_failure_count).toBe(0);
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
    expect(report.certification_result.progression_decision).toBe("CONDITIONAL_REMEDIATION_REQUIRED");
  });

  it.each([
    "SUPERVISION_CONTRACT_MISSING",
    "SUPERVISION_SCHEMA_INVALID",
    "MONITORING_NONDETERMINISTIC",
    "REPLAY_RECONSTRUCTION_FAILED",
    "EXECUTION_DRIFT_NOT_DETECTED",
    "POLICY_VIOLATION_MISSED",
    "CONSTITUTIONAL_VIOLATION_MISSED",
    "AUTHORITY_BOUNDARY_VALIDATION_FAILED",
    "RUNTIME_CONFIDENCE_NOT_REPRODUCIBLE",
    "CONFIDENCE_DEGRADATION_NOT_DETECTED",
    "RECOMMENDATION_VALIDATION_FAILED",
    "STALE_RECOMMENDATION_NOT_DETECTED",
    "INTERVENTION_RECOMMENDATION_EVIDENCE_MISSING",
    "PAUSE_RECOMMENDATION_NONDETERMINISTIC",
    "ROLLBACK_RECOMMENDATION_NONDETERMINISTIC",
    "SUPERVISION_EVIDENCE_INCOMPLETE",
    "SUPERVISION_LINEAGE_INCOMPLETE",
    "TRUTH_LEDGER_REFERENCE_INVALID",
    "GOVERNANCE_LINEAGE_INCOMPLETE",
    "OPERATOR_VISIBILITY_INCOMPLETE",
    "AUDIT_HISTORY_MUTABLE",
    "TENANT_ISOLATION_VIOLATED",
    "CROSS_TENANT_SUPERVISION_PERMITTED",
    "FAIL_CLOSED_NOT_ENFORCED",
    "AUTONOMOUS_INTERVENTION_ATTEMPTED",
    "UNAUTHORIZED_EXECUTION_CONTROL_ATTEMPTED",
    "HIDDEN_RUNTIME_STATE_EXISTS",
    "CRITICAL_CERTIFICATION_TEST_FAILED",
  ] as readonly RuntimeSupervisionCertificationScenario[])("blocks certification for %s", (scenario) => {
    const report = runRuntimeSupervisionCertificationGate({ scenario });
    const failed = report.certification_checks.find((check) => check.failure_reason === scenario as RuntimeSupervisionCertificationFailure);

    expect(report.certification_state).toBe("FAIL");
    expect(report.certification_result.critical_failure_count).toBeGreaterThan(0);
    expect(report.certification_result.failed_tests).toContain(scenario as RuntimeSupervisionCertificationFailure);
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
    expect(report.certification_result.progression_decision).toBe("BLOCKED_FROM_NEXT_EXECUTION_PHASE");
    expect(failed?.passed).toBe(false);
  });

  it("keeps the gate read-only, advisory-only, and fail-closed", () => {
    const report = runRuntimeSupervisionCertificationGate({ scenario: "AUTONOMOUS_INTERVENTION_ATTEMPTED" });

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.certification_state).toBe("FAIL");
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
    expect(report.authority_enforced).toBe(false);
  });

  it("exposes certification visibility", () => {
    const surface = buildRuntimeSupervisionCertificationVisibilitySurface({ scenario: "HIDDEN_RUNTIME_STATE_EXISTS" });

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.controlled_autonomy_progression_allowed).toBe(false);
    expect(surface.failed_tests).toContain("HIDDEN_RUNTIME_STATE_EXISTS");
    expect(surface.integrity_hash).toBeTruthy();
  });
});
