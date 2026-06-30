import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceCertificationOrchestratorObservabilitySurface,
  getGovernanceCertificationOrchestratorContract,
  runGovernanceCertificationOrchestrator,
} from "@/services/governance-certification-orchestrator";
import type { GovernanceCertificationExecutionMode, GovernanceCertificationOrchestratorScenario } from "@/types/governance-certification-orchestrator";

vi.setConfig({ testTimeout: 90000 });

describe("Mission Control Phase 7L.1 Certification Orchestrator", () => {
  it("defines certification orchestration doctrine", () => {
    const contract = getGovernanceCertificationOrchestratorContract();

    expect(contract.doctrine.schema_version).toBe("governance-certification-orchestrator/v7L.1");
    expect(contract.doctrine.principles).toContain("deterministic-sequencing");
    expect(contract.doctrine.principles).toContain("isolated-execution");
    expect(contract.doctrine.execution_modes).toContain("FULL_SYSTEM_CERTIFICATION");
    expect(contract.doctrine.failure_states).toContain("ISOLATION_FAILED");
  });

  it("runs the baseline certification suite to PASS", () => {
    const report = runGovernanceCertificationOrchestrator();

    expect(report.phase_version).toBe("7L.1");
    expect(report.run.overall_result).toBe("PASS");
    expect(report.run.execution_state).toBe("CERTIFIED");
    expect(report.overall_result.approval_status).toBe("APPROVED_FOR_PRODUCTION");
    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.governance_execution_allowed).toBe(false);
    expect(report.mutation_allowed).toBe(false);
  });

  it("builds a deterministic certification plan and isolated context", () => {
    const report = runGovernanceCertificationOrchestrator();

    expect(report.execution_plan.map((item) => item.execution_order)).toEqual([1, 2, 3, 4]);
    expect(report.execution_plan.map((item) => item.scenario_name)).toEqual(["REPLAY_CERTIFICATION", "INTEGRITY_CERTIFICATION", "QUERY_CERTIFICATION", "VISIBILITY_CERTIFICATION"]);
    expect(report.isolation_context.isolated_runtime).toBe(true);
    expect(report.isolation_context.isolated_datasets).toBe(true);
    expect(report.isolation_context.isolated_tenant_context).toBe(true);
    expect(report.tenant_isolated).toBe(true);
    expect(report.authority_protected).toBe(true);
  });

  it("records immutable scenario results, evidence, and truth-ledger output", () => {
    const report = runGovernanceCertificationOrchestrator();

    expect(report.scenario_results.length).toBe(4);
    expect(report.scenario_results.every((result) => result.evidence_reference && result.replay_reference && result.integrity_hash)).toBe(true);
    expect(report.evidence_package.certification_evidence_refs.length).toBe(4);
    expect(report.truth_ledger_record.append_only).toBe(true);
    expect(report.truth_ledger_record.scenario_result_hashes).toEqual(report.scenario_results.map((result) => result.result_hash));
    expect(report.truth_ledger_record.ledger_hash).toBeTruthy();
  });

  it("aggregates outcomes deterministically", () => {
    const first = runGovernanceCertificationOrchestrator();
    const second = runGovernanceCertificationOrchestrator();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.overall_result.overall_hash).toBe(first.overall_result.overall_hash);
    expect(first.overall_result.pass_count).toBe(4);
    expect(first.overall_result.fail_count).toBe(0);
    expect(first.observability.certification_success_rate).toBe(1);
  });

  it.each([
    ["MANUAL_CERTIFICATION", "BASELINE"],
    ["SCHEDULED_CERTIFICATION", "SCHEDULED_BASELINE"],
    ["PRE_RELEASE_CERTIFICATION", "PRE_RELEASE_BASELINE"],
    ["REGRESSION_CERTIFICATION", "REGRESSION_BASELINE"],
    ["INCREMENTAL_CERTIFICATION", "INCREMENTAL_BASELINE"],
    ["REPLAY_CERTIFICATION", "REPLAY_BASELINE"],
  ] as readonly [GovernanceCertificationExecutionMode, GovernanceCertificationOrchestratorScenario][])("supports %s mode", (mode, scenario) => {
    const report = runGovernanceCertificationOrchestrator({ scenario, execution_mode: mode });

    expect(report.run.execution_mode).toBe(mode);
    expect(report.run.overall_result).toBe("PASS");
    expect(report.timeline.length).toBe(5);
  });

  it("returns CONDITIONAL_PASS for non-blocking warnings", () => {
    const report = runGovernanceCertificationOrchestrator({ scenario: "MINOR_VISIBILITY_WARNING" });

    expect(report.run.overall_result).toBe("CONDITIONAL_PASS");
    expect(report.overall_result.approval_status).toBe("LIMITED_CERTIFICATION_MODE");
    expect(report.run.warning_count).toBeGreaterThan(0);
    expect(report.run.failed_scenarios).toBe(0);
  });

  it.each([
    ["REQUEST_INVALID", "VALIDATION_FAILED", "REQUEST_VALIDATION_FAILED"],
    ["EXECUTION_ORDER_CHANGED", "EXECUTION_FAILED", "EXECUTION_ORDER_CHANGED"],
    ["ISOLATION_BROKEN", "ISOLATION_FAILED", "ISOLATION_VIOLATION"],
    ["REPLAY_FAILED", "REPLAY_FAILED", "REPLAY_VALIDATION_FAILED"],
    ["INTEGRITY_FAILED", "INTEGRITY_FAILED", "INTEGRITY_VALIDATION_FAILED"],
    ["AGGREGATION_NONDETERMINISTIC", "AGGREGATION_FAILED", "AGGREGATION_NONDETERMINISTIC"],
    ["TENANT_ISOLATION_VIOLATION", "ISOLATION_FAILED", "TENANT_ISOLATION_VIOLATION"],
    ["AUTHORITY_BOUNDARY_EXCEEDED", "EXECUTION_FAILED", "AUTHORITY_BOUNDARY_EXCEEDED"],
  ] as const)("fails closed for %s", (scenario, executionState, failure) => {
    const report = runGovernanceCertificationOrchestrator({ scenario });

    expect(report.run.overall_result).toBe("FAIL");
    expect(report.run.execution_state).toBe(executionState);
    expect(report.overall_result.approval_status).toBe("BLOCKED");
    expect(report.overall_result.blocking_failures).toContain(failure);
    expect(report.observability.orchestration_failures).toBeGreaterThan(0);
  });

  it("keeps tenant, mission, and initiator scoped", () => {
    const report = runGovernanceCertificationOrchestrator({ tenant_id: "tenant_custom", mission_id: "mission_custom", initiated_by: "operator_custom" });

    expect(report.run.tenant_id).toBe("tenant_custom");
    expect(report.run.mission_id).toBe("mission_custom");
    expect(report.run.initiated_by).toBe("operator_custom");
    expect(report.isolation_context.tenant_id).toBe("tenant_custom");
    expect(report.isolation_context.mission_id).toBe("mission_custom");
  });

  it("exposes observability", () => {
    const surface = buildGovernanceCertificationOrchestratorObservabilitySurface({ scenario: "ISOLATION_BROKEN" });

    expect(surface.overall_result).toBe("FAIL");
    expect(surface.execution_state).toBe("ISOLATION_FAILED");
    expect(surface.scenario_count).toBe(4);
    expect(surface.isolation_violations).toBe(1);
    expect(surface.orchestration_failures).toBeGreaterThan(0);
    expect(surface.report_hash).toBeTruthy();
  });
});
