import { describe, expect, it, vi } from "vitest";
import {
  buildDelegationCertificationVisibilitySurface,
  getDelegationCertificationGateContract,
  runDelegationCertificationGate,
} from "@/services/delegation-certification-gate";
import type { DelegationCertificationFailure, DelegationCertificationScenario, DelegationCertificationState } from "@/types/delegation-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8D.5 Delegation Certification Gate", () => {
  it("publishes delegation certification doctrine", () => {
    const contract = getDelegationCertificationGateContract();

    expect(contract.doctrine.schema_version).toBe("delegation-certification-gate/v8D.5");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.principles).toContain("delegation-contract-integrity");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.validation_areas).toContain("CERTIFICATION_SUITE");
  });

  it("certifies the baseline Task Delegation Intelligence stack", () => {
    const report = runDelegationCertificationGate();

    expect(report.phase_version).toBe("8D.5");
    expect(report.certification_result.overall_state).toBe("PASS");
    expect(report.execution_orchestration_allowed).toBe(true);
    expect(report.phase8e_progression_allowed).toBe(true);
    expect(report.certification_result.production_decision).toBe("CERTIFIED_FOR_PHASE_8E");
    expect(report.certification_checks.every((check) => check.passed)).toBe(true);
  });

  it("covers all certification validation areas", () => {
    const report = runDelegationCertificationGate();
    const areas = new Set(report.certification_checks.map((check) => check.area));

    expect(areas).toEqual(new Set(["CONTRACT", "CLASSIFICATION", "AUTHORITY", "ROUTING", "REPLAY", "GOVERNANCE", "SECURITY", "EXPLAINABILITY", "LINEAGE", "CERTIFICATION_SUITE"]));
    expect(report.certification_checks.length).toBeGreaterThanOrEqual(40);
  });

  it("records immutable evidence, replay, and append-only ledger state", () => {
    const report = runDelegationCertificationGate();

    expect(report.certification_evidence.delegation_contract_version).toBe("delegation-contract/v8D.1");
    expect(report.certification_evidence.schema_version).toBe("delegation-schema/v8D.1");
    expect(report.certification_evidence.validation_results.length).toBeGreaterThan(0);
    expect(report.certification_replay.reconstructed_decision).toBe("PASS");
    expect(report.ledger_entry.append_only).toBe(true);
    expect(report.ledger_entry.evidence_hash).toBe(report.certification_evidence.evidence_hash);
    expect(report.ledger_entry.check_hashes).toEqual(report.certification_checks.map((check) => check.check_hash));
  });

  it("is deterministic across repeated certification runs", () => {
    const first = runDelegationCertificationGate();
    const second = runDelegationCertificationGate();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.certification_result.result_hash).toBe(first.certification_result.result_hash);
    expect(second.certification_evidence.evidence_hash).toBe(first.certification_evidence.evidence_hash);
    expect(second.certification_checks.map((check) => check.check_hash)).toEqual(first.certification_checks.map((check) => check.check_hash));
  });

  it("allows conditional pass only for non-critical reporting gaps", () => {
    const report = runDelegationCertificationGate({ scenario: "MINOR_REPORTING_GAP" });

    expect(report.certification_result.overall_state).toBe("CONDITIONAL_PASS");
    expect(report.certification_result.warning_count).toBe(1);
    expect(report.certification_result.critical_failure_count).toBe(0);
    expect(report.execution_orchestration_allowed).toBe(false);
    expect(report.phase8e_progression_allowed).toBe(false);
    expect(report.certification_result.production_decision).toBe("LIMITED_REMEDIATION_REQUIRED");
  });

  it.each([
    ["DELEGATION_CONTRACT_MISSING", "FAIL"],
    ["DELEGATION_SCHEMA_INVALID", "FAIL"],
    ["TASK_CLASSIFICATION_NONDETERMINISTIC", "FAIL"],
    ["NONDETERMINISTIC_CLASSIFICATION_NOT_DETECTED", "FAIL"],
    ["OPERATOR_TASK_MISCLASSIFIED", "FAIL"],
    ["UNAUTHORIZED_AGENT_ASSIGNMENT", "FAIL"],
    ["INCONSISTENT_ROUTING_DECISION", "FAIL"],
    ["DEFERRED_TASK_EXECUTED_PREMATURELY", "FAIL"],
    ["BLOCKED_TASK_EXECUTED", "FAIL"],
    ["AUTHORITY_MISMATCH", "FAIL"],
    ["CONSTITUTIONAL_VIOLATION_PERMITTED", "FAIL"],
    ["POLICY_BYPASS_NOT_DETECTED", "FAIL"],
    ["OPERATOR_AUTHORITY_BYPASSED", "FAIL"],
    ["UNCERTIFIED_DELEGATE_ASSIGNED", "FAIL"],
    ["DELEGATION_REPLAY_MISMATCH", "FAIL"],
    ["ROUTING_INCONSISTENCY", "FAIL"],
    ["FALLBACK_ROUTING_MISMATCH", "FAIL"],
    ["MISSING_DELEGATION_EXPLANATION", "FAIL"],
    ["LINEAGE_CORRUPTION_NOT_DETECTED", "FAIL"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "FAIL"],
    ["CROSS_TENANT_DELEGATION_PERMITTED", "FAIL"],
    ["AUTONOMOUS_AUTHORITY_ESCALATION", "FAIL"],
  ] as readonly [DelegationCertificationScenario, DelegationCertificationState][])("blocks certification for %s", (scenario, state) => {
    const report = runDelegationCertificationGate({ scenario });
    const failed = report.certification_checks.find((check) => check.failure_reason === scenario as DelegationCertificationFailure);

    expect(report.certification_result.overall_state).toBe(state);
    expect(report.certification_result.critical_failure_count).toBeGreaterThan(0);
    expect(report.certification_result.blocking_failures).toContain(scenario as DelegationCertificationFailure);
    expect(report.execution_orchestration_allowed).toBe(false);
    expect(report.phase8e_progression_allowed).toBe(false);
    expect(report.certification_result.production_decision).toBe("BLOCKED_FROM_EXECUTION_ORCHESTRATION");
    expect(failed?.passed).toBe(false);
  });

  it("keeps the gate read-only, advisory-only, and fail-closed", () => {
    const report = runDelegationCertificationGate({ scenario: "TENANT_ISOLATION_NOT_ENFORCED" });

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.certification_result.overall_state).toBe("FAIL");
    expect(report.execution_orchestration_allowed).toBe(false);
    expect(report.tenant_isolated).toBe(false);
  });

  it("exposes certification visibility", () => {
    const surface = buildDelegationCertificationVisibilitySurface({ scenario: "AUTONOMOUS_AUTHORITY_ESCALATION" });

    expect(surface.overall_state).toBe("FAIL");
    expect(surface.execution_orchestration_allowed).toBe(false);
    expect(surface.phase8e_progression_allowed).toBe(false);
    expect(surface.blocking_failures).toContain("AUTONOMOUS_AUTHORITY_ESCALATION");
    expect(surface.report_hash).toBeTruthy();
  });
});
