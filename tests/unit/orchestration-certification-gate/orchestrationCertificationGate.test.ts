import { describe, expect, it, vi } from "vitest";
import {
  buildOrchestrationCertificationObservabilitySurface,
  getOrchestrationCertificationGateContract,
  runOrchestrationCertificationGate,
} from "@/services/orchestration-certification-gate";
import type {
  OrchestrationCertificationFailure,
  OrchestrationCertificationScenario,
  OrchestrationCertificationState,
} from "@/types/orchestration-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8C.8 Orchestration Certification Gate", () => {
  it("defines the orchestration certification doctrine", () => {
    const contract = getOrchestrationCertificationGateContract();

    expect(contract.doctrine.schema_version).toBe("orchestration-certification-gate/v8C.8");
    expect(contract.doctrine.principles).toContain("coordination-service-only");
    expect(contract.doctrine.principles).toContain("constitutionally-subordinate");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.components).toEqual([
      "8C.1_EXECUTION_CONTRACT",
      "8C.2_WORKFLOW_ORCHESTRATOR",
      "8C.3_TASK_SEQUENCING",
      "8C.4_DEPENDENCY_SCHEDULER",
      "8C.5_EXECUTION_MONITOR",
      "8C.6_CHECKPOINT_MANAGER",
      "8C.7_ROLLBACK_PREPARATION",
    ]);
  });

  it("certifies the baseline Phase 8C orchestration subsystem", () => {
    const report = runOrchestrationCertificationGate();

    expect(report.phase_version).toBe("8C.8");
    expect(report.certification_result.overall_state).toBe("PASS");
    expect(report.production_deployment_allowed).toBe(true);
    expect(report.production_readiness_assessment.deployment_allowed).toBe(true);
    expect(report.certification_result.production_decision).toBe("CERTIFIED_FOR_CONTROLLED_AUTONOMY");
    expect(report.timeline.at(-1)?.state).toBe("CERTIFIED");
  });

  it("validates every Phase 8C component and certification category", () => {
    const report = runOrchestrationCertificationGate();
    const areas = new Set(report.certification_checks.map((check) => check.area));

    expect(report.component_summaries).toHaveLength(7);
    expect(report.component_summaries.every((summary) => summary.certification_state === "PASS")).toBe(true);
    expect(areas).toEqual(new Set([
      "EXECUTION_CONTRACT",
      "WORKFLOW_ORCHESTRATOR",
      "TASK_SEQUENCING",
      "DEPENDENCY_SCHEDULER",
      "EXECUTION_MONITOR",
      "CHECKPOINT_MANAGER",
      "ROLLBACK_PREPARATION",
      "DETERMINISM",
      "REPLAY",
      "GOVERNANCE",
      "AUTHORITY",
      "INTEGRITY",
      "ISOLATION",
      "OPERATOR_VISIBILITY",
      "CERTIFICATION_SUITE",
    ]));
    expect(report.certification_checks.length).toBeGreaterThanOrEqual(31);
    expect(report.certification_checks.every((check) => check.passed)).toBe(true);
  });

  it("is deterministic across repeated certification runs", () => {
    const first = runOrchestrationCertificationGate();
    const second = runOrchestrationCertificationGate();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.certification_result.result_hash).toBe(first.certification_result.result_hash);
    expect(second.certification_checks.map((check) => check.check_hash)).toEqual(first.certification_checks.map((check) => check.check_hash));
    expect(second.certification_evidence.certification_hash).toBe(first.certification_evidence.certification_hash);
  });

  it("records immutable evidence and an append-only certification ledger entry", () => {
    const report = runOrchestrationCertificationGate();

    expect(report.certification_evidence.phase).toBe("8C");
    expect(report.certification_evidence.execution_reference).toBeTruthy();
    expect(report.certification_evidence.workflow_reference).toBeTruthy();
    expect(report.certification_evidence.replay_reference).toBeTruthy();
    expect(report.certification_evidence.integrity_reference).toBeTruthy();
    expect(report.certification_ledger_entry.append_only).toBe(true);
    expect(report.certification_ledger_entry.evidence_hash).toBe(report.certification_evidence.certification_hash);
    expect(report.certification_ledger_entry.check_hashes).toEqual(report.certification_checks.map((check) => check.check_hash));
  });

  it("supports conditional pass for non-critical reporting completeness gaps", () => {
    const report = runOrchestrationCertificationGate({ scenario: "REPORTING_COMPLETENESS_GAP" });

    expect(report.certification_result.overall_state).toBe("CONDITIONAL_PASS");
    expect(report.certification_result.warning_count).toBe(1);
    expect(report.certification_result.critical_failure_count).toBe(0);
    expect(report.production_deployment_allowed).toBe(false);
    expect(report.production_readiness_assessment.deployment_allowed).toBe(false);
    expect(report.certification_result.production_decision).toBe("LIMITED_REMEDIATION_REQUIRED");
    expect(report.timeline.at(-1)?.state).toBe("CONDITIONAL_CERTIFICATION");
  });

  it.each([
    ["EXECUTION_CONTRACT_INVALID", "FAIL"],
    ["ORCHESTRATION_NONDETERMINISTIC", "FAIL"],
    ["TASK_SEQUENCING_NONDETERMINISTIC", "FAIL"],
    ["DEPENDENCY_GRAPH_NONREPRODUCIBLE", "FAIL"],
    ["CIRCULAR_DEPENDENCY_NOT_REJECTED", "FAIL"],
    ["CHECKPOINT_INTEGRITY_NOT_VERIFIED", "FAIL"],
    ["ROLLBACK_PLAN_NOT_GENERATED", "FAIL"],
    ["EXECUTION_MONITORING_NOT_OPERATIONAL", "FAIL"],
    ["EXECUTION_DRIFT_NOT_DETECTED", "FAIL"],
    ["ORCHESTRATION_REPLAY_MISMATCH", "FAIL"],
    ["GOVERNANCE_REFERENCES_NOT_PRESERVED", "FAIL"],
    ["AUTHORITY_VALIDATION_NOT_ENFORCED", "FAIL"],
    ["CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", "FAIL"],
    ["UNAUTHORIZED_EXECUTION_NOT_REJECTED", "FAIL"],
    ["GOVERNANCE_BYPASS_NOT_PREVENTED", "FAIL"],
    ["AUTHORITY_ESCALATION_NOT_REJECTED", "FAIL"],
    ["TENANT_ISOLATION_NOT_ENFORCED", "FAIL"],
    ["HIDDEN_ORCHESTRATION_STATE_NOT_PROHIBITED", "FAIL"],
    ["INTEGRITY_HASHES_NOT_REPRODUCIBLE", "FAIL"],
    ["CERTIFICATION_SUITE_NOT_PASSING", "FAIL"],
  ] as readonly [OrchestrationCertificationScenario, OrchestrationCertificationState][])("blocks higher autonomy for %s", (scenario, state) => {
    const report = runOrchestrationCertificationGate({ scenario });
    const failed = report.certification_checks.find((check) => check.failure_reason === scenario as OrchestrationCertificationFailure);

    expect(report.certification_result.overall_state).toBe(state);
    expect(report.certification_result.critical_failure_count).toBeGreaterThan(0);
    expect(report.certification_result.blocking_failures).toContain(scenario as OrchestrationCertificationFailure);
    expect(report.production_deployment_allowed).toBe(false);
    expect(report.certification_result.production_decision).toBe("BLOCKED_FROM_HIGHER_AUTONOMY");
    expect(report.timeline.at(-1)?.state).toBe("BLOCKED");
    expect(failed?.passed).toBe(false);
  });

  it("keeps orchestration certification read-only, advisory-only, and subordinate to governance", () => {
    const report = runOrchestrationCertificationGate();

    expect(report.coordination_service_only).toBe(true);
    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.governance_subordinate).toBe(true);
    expect(report.autonomous_execution_authority).toBe(false);
    expect(report.deterministic).toBe(true);
    expect(report.replayable).toBe(true);
    expect(report.explainable).toBe(true);
    expect(report.integrity_protected).toBe(true);
    expect(report.tenant_isolated).toBe(true);
    expect(report.operator_visible).toBe(true);
  });

  it("exposes certification observability", () => {
    const surface = buildOrchestrationCertificationObservabilitySurface({ scenario: "CERTIFICATION_SUITE_NOT_PASSING" });

    expect(surface.overall_state).toBe("FAIL");
    expect(surface.lifecycle_state).toBe("BLOCKED");
    expect(surface.certification_test_count).toBeGreaterThanOrEqual(31);
    expect(surface.critical_failure_count).toBeGreaterThan(0);
    expect(surface.production_decision).toBe("BLOCKED_FROM_HIGHER_AUTONOMY");
    expect(surface.production_deployment_allowed).toBe(false);
    expect(surface.report_hash).toBeTruthy();
  });
});
